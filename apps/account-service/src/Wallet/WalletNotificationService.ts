import { Injectable, Inject } from '@nestjs/common';
import { BuildersService } from '@builder/builders';
import { TransferCreateButtonDto } from 'apps/transfer-service/src/dto/transfer.create.button.dto';
import EventsNamesMessageEnum from 'apps/message-service/src/enum/events.names.message.enum';
import EventsNamesTransferEnum from 'apps/transfer-service/src/enum/events.names.transfer.enum';
import EventsNamesAccountEnum from '../enum/events.names.account.enum';
import { User } from '@user/user/entities/mongoose/user.schema';
import { EnvironmentEnum } from '@common/common/enums/environment.enum';

@Injectable()
export class WalletNotificationService {
  constructor(
    @Inject(BuildersService)
    private readonly ewalletBuilder: BuildersService,
  ) {}

  async sendNotification(wallet: any, user: User) {
    const emailData = {
      destinyText: user.email,
      vars: {
        name: user.name,
        accountType: wallet.accountType,
        accountName: wallet.accountName,
        balance: wallet.amount,
        currency: wallet.currency,
        accountId: wallet.accountId,
      },
    };

    await this.ewalletBuilder.emitMessageEventClient(
      EventsNamesMessageEnum.sendCryptoWalletsManagement,
      emailData,
    );

    if (!wallet.crm && process.env.ENVIRONMENT === EnvironmentEnum.prod) {
      const transferBtn: TransferCreateButtonDto = {
        amount: '999',
        currency: 'USD',
        account: wallet.id ?? wallet._id,
        creator: wallet.owner,
        details: 'Deposit address',
        customer_name: user.name,
        customer_email: user.email,
        public_key: null,
        identifier: wallet.owner,
      };

      const depositLink =
        await this.ewalletBuilder.getPromiseTransferEventClient(
          EventsNamesTransferEnum.createOneDepositLink,
          transferBtn,
        );

      await this.ewalletBuilder.emitAccountEventClient(
        EventsNamesAccountEnum.updateOne,
        {
          id: wallet.id ?? wallet._id,
          responseCreation: depositLink,
        },
      );
    }
  }

  async sendOperationNotification(
    from: any,
    to: any,
    amount: number,
    operationType: string,
  ) {
    const emailData = {
      destinyText: from.email,
      vars: {
        fromWallet: from.name,
        toWallet: to.name,
        amount: amount,
        operationType: operationType,
        date: new Date().toISOString(),
      },
    };

    await this.ewalletBuilder.emitMessageEventClient(
      EventsNamesMessageEnum.sendCryptoWalletsOperation,
      emailData,
    );
  }

  async sendBalanceUpdateNotification(
    wallet: any,
    previousBalance: number,
    newBalance: number,
  ) {
    const emailData = {
      destinyText: wallet.email,
      vars: {
        walletName: wallet.name,
        previousBalance: previousBalance,
        newBalance: newBalance,
        difference: newBalance - previousBalance,
        currency: wallet.currency,
        date: new Date().toISOString(),
      },
    };

    this.ewalletBuilder.emitMessageEventClient(
      EventsNamesMessageEnum.sendCryptoWalletsBalance,
      emailData,
    );
  }
}
