import StatusAccountEnum from '@account/account/enum/status.account.enum';
import TypesAccountEnum from '@account/account/enum/types.account.enum';
import WalletTypesAccountEnum from '@account/account/enum/wallet.types.account.enum';
import { BuildersService } from '@builder/builders';
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
    try {
      return new Promise(async (res) => {
        createReadStream(file.path)
          .pipe(csv())
          .on('data', async (data) => {
            Logger.log(
              JSON.stringify(data['Email']),
              B2CoreMigrationService.name,
            );
            const user = await this.getUserByEmail(data['Email']);
            if (user) {
              const walletAccount = this.buildAccount(data, user);
              const account = await this.migrateWalletAccount(walletAccount);
              if (account) {
                results.push(account);
              }
            }
          })
          .on('end', () => {
            Logger.log(results, B2CoreMigrationService.name);
            res(results);
          });
      });
    } catch (error) {
      Logger.error(error, B2CoreMigrationService.name);
    }
  }

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
      owner: user.id,
      amount: wallet['Balance'],
      currency: CurrencyCodeB2cryptoEnum[wallet['Currency']],
      amountCustodial: wallet['Balance'],
      currencyCustodial: CurrencyCodeB2cryptoEnum.USD,
      amountBlocked: 0,
      currencyBlocked: CurrencyCodeB2cryptoEnum.USD,
      amountBlockedCustodial: 0,
      currencyBlockedCustodial: CurrencyCodeB2cryptoEnum.USD,
      statusText: StatusAccountEnum.UNLOCK,
      showToOwner: true,
      hasSendDisclaimer: false,
    };
  }
}
