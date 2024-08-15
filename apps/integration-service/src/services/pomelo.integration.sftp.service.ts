import { Injectable, Logger } from '@nestjs/common';
const sftpClient = require('ssh2-sftp-client');
const fs = require('fs');

@Injectable()
export class PomeloIntegrationSFTPService {
  private client = new sftpClient();
  private sshKey = fs.readFileSync(
    `./sftp/pomelo-${process.env.ENVIRONMENT?.toLocaleLowerCase()}`,
    'utf8',
  );

  private sftpProps = {
    host: process.env.POMELO_SFTP_HOST,
    port: process.env.POMELO_SFTP_PORT,
    username: process.env.POMELO_SFTP_USR,
    privateKey: this.sshKey,
    passphrase: process.env.POMELO_SFTP_PASSPHRASE,
  };

  private async connect() {
    Logger.log(`About to connect`, PomeloIntegrationSFTPService.name);
    try {
      await this.client.connect(this.sftpProps);
    } catch (error) {
      Logger.error(error, PomeloIntegrationSFTPService.name);
    }
  }

  private buildFilename(prefix: string, client: string, country: string) {
    let date = new Date();
    date.setDate(date.getDate() - 1);
    const formattedDate = `${date.toISOString().split('T')[0]}`;
    return `${prefix}_${formattedDate}_${client}_${country}.csv`;
  }

  private async storeFile(remoteFile: string, localFile: string) {
    Logger.log(
      `Storing remote file ${remoteFile} to ${localFile}`,
      PomeloIntegrationSFTPService.name,
    );
    try {
      await this.client.get(remoteFile, localFile);
    } catch (error) {
      Logger.error(error, PomeloIntegrationSFTPService.name);
    }
  }

  private async endConnection() {
    Logger.log(`Closing SFTP connection`, PomeloIntegrationSFTPService.name);
    try {
      await this.client.end();
    } catch (error) {
      Logger.error(error, PomeloIntegrationSFTPService.name);
    }
  }

  async getSFTPPomeloReportsByClient(client: string, country: string) {
    try {
      await this.connect();
      const presentment = this.buildFilename('presentment', client, country);
      const transaction = this.buildFilename('transaction', client, country);
      await this.storeFile(
        `./${presentment}`,
        `./sftp/downloads/${presentment}`,
      );
      await this.storeFile(
        `./${transaction}`,
        `./sftp/downloads/${transaction}`,
      );
      this.endConnection();
    } catch (error) {
      Logger.error(error, PomeloIntegrationSFTPService.name);
    }
  }
}
