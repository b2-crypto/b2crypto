import { Inject, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import * as sftpClient from 'ssh2-sftp-client';
import { Logger } from 'winston';

import { Traceable } from '@amplication/opentelemetry-nestjs';

@Traceable()
@Injectable()
export class PomeloIntegrationSFTPService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

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
    this.logger.debug(`About to connect`, PomeloIntegrationSFTPService.name);
    try {
      await this.client.connect(this.sftpProps);
    } catch (error) {
      this.logger.error(PomeloIntegrationSFTPService.name, error);
    }
  }

  private buildFilename(prefix: string, client: string, country: string) {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    const formattedDate = `${date.toISOString().split('T')[0]}`;
    return `${prefix}_${formattedDate}_${client}_${country}.csv`;
  }

  private async storeFile(remoteFile: string, localFile: string) {
    this.logger.debug(
      PomeloIntegrationSFTPService.name,
      `Storing remote file ${remoteFile} to ${localFile}`,
    );
    try {
      await this.client.get(remoteFile, localFile);
    } catch (error) {
      this.logger.error(PomeloIntegrationSFTPService.name, error);
    }
  }

  private async endConnection() {
    this.logger.debug(
      `Closing SFTP connection`,
      PomeloIntegrationSFTPService.name,
    );
    try {
      await this.client.end();
    } catch (error) {
      this.logger.error(PomeloIntegrationSFTPService.name, error);
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
      this.logger.error(PomeloIntegrationSFTPService.name, error);
    }
  }
}
