import StatusAccountEnum from '@account/account/enum/status.account.enum';
import TypesAccountEnum from '@account/account/enum/types.account.enum';
import WalletTypesAccountEnum from '@account/account/enum/wallet.types.account.enum';
import { Traceable } from '@amplication/opentelemetry-nestjs';
import { BuildersService } from '@builder/builders';
import { CommonService } from '@common/common';
import CurrencyCodeB2cryptoEnum from '@common/common/enums/currency-code-b2crypto.enum';
import { Injectable } from '@nestjs/common';
import EventsNamesAccountEnum from 'apps/account-service/src/enum/events.names.account.enum';
import EventsNamesUserEnum from 'apps/user-service/src/enum/events.names.user.enum';
import * as csv from 'csv-parser';
import { createReadStream } from 'fs';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Traceable()
@Injectable()
export class B2CoreMigrationService {
  constructor(
    @InjectPinoLogger(B2CoreMigrationService.name)
    protected readonly logger: PinoLogger,
    private builder: BuildersService,
  ) {}

  async startB2CoreMigration(file: Express.Multer.File) {
    const results = [];
    const migrated = [];
    try {
      const results = await this.getFileRows(file);
      for (let i = 0; i < results.length; i++) {
        const data = results[i];
        this.logger.debug(
          `[startB2CoreMigration] data: ${JSON.stringify(data)}`,
        );
        if (data['Client status'] === 'Active') {
          const email = data['Email'];
          const user = await this.getUserByEmail(data);
          const walletAccount = this.buildAccount(data, user);
          this.logger.debug(
            `[startB2CoreMigration] Creating wallet: ${walletAccount.name}-${walletAccount.accountId}`,
          );
          const account = await this.migrateWalletAccount(walletAccount);
          if (account) {
            migrated.push(account);
          }
        }
      }
    } catch (error) {
      this.logger.error(`[startB2CoreMigration] ${error.message || error}`);
    }
    return migrated;
  }
  async migrateB2CoreVerification(file: Express.Multer.File) {
    const migrated = [];
    try {
      const results = await this.getFileRows(file);
      for (let i = 0; i < results.length; i++) {
        const data = results[i];
        this.logger.debug(
          `[migrateB2CoreVerification] data: ${JSON.stringify(data)}`,
        );
        if (data['Client status'] === 'Active') {
          const email = data['Email'];
          const user = await this.migrateUser(data);
          const walletAccount = this.buildAccount(data, user);
          this.logger.debug(
            `[migrateB2CoreVerification] Creating wallet: ${walletAccount.name}-${walletAccount.accountId}`,
          );
          const account = await this.migrateWalletAccount(walletAccount);
          if (account) {
            migrated.push(account);
          }
        }
      }
    } catch (error) {
      this.logger.error(
        `[migrateB2CoreVerification] ${error.message || error}`,
      );
    }
    return migrated;
  }

  async getFileRows(file: Express.Multer.File): Promise<Array<any>> {
    const results = [];
    return new Promise(async (res, rej) => {
      try {
        createReadStream(file.path)
          .pipe(csv())
          .on('data', async (data) => {
            results.push(data);
          })
          .on('end', () => {
            this.logger.debug(`[getFileRows] results: ${results.length} rows`);
            res(results);
          });
      } catch (error) {
        this.logger.error(`[getFileRows] error: ${error.message || error}`);
        rej(error);
      }
    });
  }
  /* async startB2CoreMigration(file: Express.Multer.File) {
    const results = [];
    try {
      return new Promise(async (res) => {
        createReadStream(file.path)
          .pipe(csv())
          .on('data', async (data) => {
            this.logger.debug(
              JSON.stringify(data['Email']),
              B2CoreMigrationService.name,
            );
            results.push(this.getWallet(data));
          })
          .on('end', async () => {
            this.logger.debug('Already', B2CoreMigrationService.name);
            const list = await Promise.all(results);
            Logger.debug(list, `${B2CoreMigrationService.name} - list`);
            res(list);
          });
      });
    } catch (error) {
      this.logger.error(B2CoreMigrationService.name, error);
    }
  }

  private async getWallet(data: any) {
    const email = data['Email'];
    const user = await this.getUserByEmail(data);
    const walletAccount = this.buildAccount(data, user);
    this.logger.debug(
      `Creating wallet: ${walletAccount.name}-${walletAccount.accountId}`,
      `${walletAccount.owner} - ${email}`,
    );
    const account = await this.migrateWalletAccount(walletAccount);
    if (account) {
      return account;
    }
    return null;
  } */

  private async getUserByEmail(data: any) {
    try {
      const email = data['Email'];
      let user = await this.builder.getPromiseUserEventClient(
        EventsNamesUserEnum.findOneByEmail,
        email,
      );
      if (!user._id) {
        user = await this.builder.getPromiseUserEventClient(
          EventsNamesUserEnum.migrateOne,
          {
            email: data['Email'],
            name: data['Client name'],
            password: CommonService.generatePassword(8),
            confirmPassword: 'send-password',
          },
        );
      }
      this.logger.debug(
        `[B2CoreMigrationService] User ${email} ${
          user ? 'was found' : 'was NOT found'
        }`,
      );
      return user;
    } catch (error) {
      this.logger.error(
        `[B2CoreMigrationService] error: ${error.message || error}`,
      );
    }
  }

  private async migrateUser(data: any) {
    try {
      const userToMigrate = this.buildUser(data);
      const user = await this.builder.getPromiseUserEventClient(
        EventsNamesUserEnum.migrateOne,
        userToMigrate,
      );
      return user;
    } catch (error) {
      this.logger.error(`[migrateUser] error: ${error.message || error}`);
    }
  }

  private buildUser(data: any) {
    let verifyIdentity = false;
    // Valida si debe pasar con verifyIdentity
    if (
      !data['Client verification level'] ||
      data['Client verification level'] !== 'Level 1'
    ) {
      verifyIdentity = true;
    }
    let individual = false;
    // Valida si es individual o corporativo
    if (verifyIdentity && data['Client verification level'] === 'Level 2') {
      individual = true;
    }
    let verifyIdentityLevelName: string;
    // Valida si debe pasar el valor de verifyIdentityLevelName
    if (verifyIdentity) {
      verifyIdentityLevelName = data['Client verification level'];
    }
    return {
      email: data['Email'],
      name: data['Client name'],
      password: CommonService.generatePassword(8),
      confirmPassword: 'send-password',
      verifyIdentity,
      individual,
      verifyIdentityLevelName,
      verifyEmail: true,
    };
  }

  private async migrateWalletAccount(walletAccount: any) {
    try {
      this.logger.debug(
        `[migrateWalletAccount] Creating wallet: ${JSON.stringify(
          walletAccount,
        )}`,
      );
      const account = await this.builder.getPromiseAccountEventClient(
        EventsNamesAccountEnum.migrateOneWallet,
        walletAccount,
      );
      return account;
    } catch (error) {
      this.logger.error(
        `[migrateWalletAccount] error: ${error.message || error}`,
      );
    }
  }

  private buildAccount(wallet: any, user: any): any {
    return {
      name: wallet['Currency'],
      accountId: wallet['Account ID'],
      type: TypesAccountEnum.WALLET,
      accountType: WalletTypesAccountEnum.VIRTUAL,
      owner: user._id,
      amount: wallet['Balance'],
      currency: CurrencyCodeB2cryptoEnum[wallet['Currency']],
      amountCustodial: wallet['Balance'],
      currencyCustodial: CurrencyCodeB2cryptoEnum[wallet['Currency']],
      amountBlocked: 0,
      currencyBlocked: CurrencyCodeB2cryptoEnum[wallet['Currency']],
      amountBlockedCustodial: 0,
      currencyBlockedCustodial: CurrencyCodeB2cryptoEnum[wallet['Currency']],
      statusText: StatusAccountEnum.UNLOCK,
      showToOwner: true,
      hasSendDisclaimer: false,
    };
  }
}
