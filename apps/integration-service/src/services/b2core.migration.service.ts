import StatusAccountEnum from '@account/account/enum/status.account.enum';
import TypesAccountEnum from '@account/account/enum/types.account.enum';
import WalletTypesAccountEnum from '@account/account/enum/wallet.types.account.enum';
import { BuildersService } from '@builder/builders';
import { CommonService } from '@common/common';
import CurrencyCodeB2cryptoEnum from '@common/common/enums/currency-code-b2crypto.enum';
import { Injectable, Logger } from '@nestjs/common';
import EventsNamesAccountEnum from 'apps/account-service/src/enum/events.names.account.enum';
import EventsNamesUserEnum from 'apps/user-service/src/enum/events.names.user.enum';
import * as csv from 'csv-parser';
import { createReadStream } from 'fs';

@Injectable()
export class B2CoreMigrationService {
  constructor(private builder: BuildersService) {}

  async startB2CoreMigration(file: Express.Multer.File) {
    const results = [];
    const migrated = [];
    try {
      const results = await this.getFileRows(file);
      for (let i = 0; i < results.length; i++) {
        const data = results[i];
        Logger.log(JSON.stringify(data['Email']), B2CoreMigrationService.name);
        if (data['Client status'] === 'Active') {
          const email = data['Email'];
          let user = await this.getUserByEmail(email);
          if (!user._id) {
            user = await this.builder.getPromiseUserEventClient(
              EventsNamesUserEnum.createOne,
              {
                email: email,
                name: data['Client name'],
                password: CommonService.generatePassword(8),
                confirmPassword: 'send-password',
              },
            );
            Logger.log(
              `User ${email} ${user ? 'was found' : 'was NOT found'}`,
              `Created user - ${user.name} - ${user.email}`,
            );
          }
          const walletAccount = this.buildAccount(data, user);
          Logger.log(
            `Creating wallet: ${walletAccount.name}-${walletAccount.accountId}`,
            `${walletAccount.owner} - ${email}`,
          );
          const account = await this.migrateWalletAccount(walletAccount);
          if (account) {
            migrated.push(account);
          }
        }
      }
    } catch (error) {
      Logger.error(error, B2CoreMigrationService.name);
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
            Logger.log(results, B2CoreMigrationService.name);
            res(results);
          });
      } catch (error) {
        Logger.error(error, B2CoreMigrationService.name);
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
            Logger.log(
              JSON.stringify(data['Email']),
              B2CoreMigrationService.name,
            );
            results.push(this.getWallet(data));
          })
          .on('end', async () => {
            Logger.log('Already', B2CoreMigrationService.name);
            const list = await Promise.all(results);
            Logger.debug(list, `${B2CoreMigrationService.name} - list`);
            res(list);
          });
      });
    } catch (error) {
      Logger.error(error, B2CoreMigrationService.name);
    }
  }

  private async getWallet(data: any) {
    const email = data['Email'];
    let user = await this.getUserByEmail(email);
    if (!user._id) {
      user = await this.builder.getPromiseUserEventClient(
        EventsNamesUserEnum.createOne,
        {
          email: email,
          name: data['Client name'],
          password: CommonService.generatePassword(8),
          confirmPassword: 'send-password',
        },
      );
      Logger.log(
        `User ${email} ${user ? 'was found' : 'was NOT found'}`,
        `Created user - ${user.name} - ${user.email}`,
      );
    }
    const walletAccount = this.buildAccount(data, user);
    Logger.log(
      `Creating wallet: ${walletAccount.name}-${walletAccount.accountId}`,
      `${walletAccount.owner} - ${email}`,
    );
    const account = await this.migrateWalletAccount(walletAccount);
    if (account) {
      return account;
    }
    return null;
  } */

  private async getUserByEmail(email: string) {
    try {
      const user = await this.builder.getPromiseUserEventClient(
        EventsNamesUserEnum.findOneByEmail,
        email,
      );
      Logger.log(
        `User ${email} ${user ? 'was found' : 'was NOT found'}`,
        B2CoreMigrationService.name,
      );
      return user;
    } catch (error) {
      Logger.error(error, B2CoreMigrationService.name);
    }
  }

  private async migrateWalletAccount(walletAccount: any) {
    try {
      Logger.log(
        `Creating wallet: ${JSON.stringify(walletAccount)}`,
        B2CoreMigrationService.name,
      );
      const account = await this.builder.getPromiseAccountEventClient(
        EventsNamesAccountEnum.migrateOneWallet,
        walletAccount,
      );
      return account;
    } catch (error) {
      Logger.error(error, B2CoreMigrationService.name);
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
