import { WalletDepositCreateDto } from '@account/account/dto/wallet-deposit.create.dto';
import { WalletCreateDto } from '@account/account/dto/wallet.create.dto';
import { AccountDocument } from '@account/account/entities/mongoose/account.schema';
import StatusAccountEnum from '@account/account/enum/status.account.enum';
import TypesAccountEnum from '@account/account/enum/types.account.enum';
import WalletTypesAccountEnum from '@account/account/enum/wallet.types.account.enum';
import { BuildersService } from '@builder/builders';
import { StatusCashierEnum } from '@common/common/enums/StatusCashierEnum';
import TagEnum from '@common/common/enums/TagEnum';
import { ResponsePaginator } from '@common/common/interfaces/response-pagination.interface';
import { IntegrationService } from '@integration/integration';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { TransferCreateDto } from '@transfer/transfer/dto/transfer.create.dto';
import { OperationTransactionType } from '@transfer/transfer/enum/operation.transaction.type.enum';
import { User } from '@user/user/entities/mongoose/user.schema';
import EventsNamesCategoryEnum from 'apps/category-service/src/enum/events.names.category.enum';
import EventsNamesPspAccountEnum from 'apps/psp-service/src/enum/events.names.psp.acount.enum';
import EventsNamesStatusEnum from 'apps/status-service/src/enum/events.names.status.enum';
import { TransferCreateButtonDto } from 'apps/transfer-service/src/dto/transfer.create.button.dto';
import EventsNamesTransferEnum from 'apps/transfer-service/src/enum/events.names.transfer.enum';
import { UserServiceService } from 'apps/user-service/src/user-service.service';
import { AccountServiceService } from './account-service.service';
import EventsNamesAccountEnum from './enum/events.names.account.enum';
import { WalletB2BinPayService } from './Wallet/WalletB2BinPayService';
import { WalletBaseService } from './Wallet/WalletBaseService';
import { WalletFireblocksService } from './Wallet/WalletFireblocksService';
import { WalletNotificationService } from './Wallet/WalletNotificationService';
import { WalletTransactionService } from './Wallet/WalletTransactionService';

@Injectable()
export class WalletServiceService {
  private cryptoType = null;

  constructor(
    @Inject(AccountServiceService)
    private readonly accountService: AccountServiceService,
    @Inject(UserServiceService)
    private readonly userService: UserServiceService,
    @Inject(BuildersService)
    private readonly ewalletBuilder: BuildersService,
    @Inject(WalletBaseService)
    private readonly baseService: WalletBaseService,
    @Inject(WalletB2BinPayService)
    private readonly b2binpayService: WalletB2BinPayService,
    @Inject(WalletFireblocksService)
    private readonly fireblocksService: WalletFireblocksService,
    @Inject(WalletTransactionService)
    private readonly transactionService: WalletTransactionService,
    @Inject(WalletNotificationService)
    private readonly notificationService: WalletNotificationService,
    private readonly integration: IntegrationService,
  ) {}

  async createWallet(
    createDto: WalletCreateDto,
    userId?: string,
  ): Promise<AccountDocument> {
    switch (createDto.accountType) {
      case WalletTypesAccountEnum.EWALLET:
        return this.b2binpayService.createWalletB2BinPay(createDto, userId);
      case WalletTypesAccountEnum.VAULT:
        return this.fireblocksService.createWalletFireblocks(createDto, userId);
      default:
        throw new BadRequestException(
          `The accountType ${createDto.accountType} is not valid`,
        );
    }
  }

  async findWallets(query: any): Promise<ResponsePaginator<AccountDocument>> {
    return this.accountService.findAll({
      ...query,
      where: {
        ...query.where,
        type: TypesAccountEnum.WALLET,
      },
    });
  }

  async findWalletById(id: string): Promise<AccountDocument> {
    return this.baseService.getWalletByIdAndValidate(id);
  }

  async rechargeWallet(
    createDto: WalletDepositCreateDto,
    userId: string,
    host: string,
  ) {
    try {
      const user = await this.baseService.getUser(userId);

      if (createDto.amount <= 10) {
        throw new BadRequestException('The recharge must be greater than 10');
      }

      const to = await this.baseService.getWalletByIdAndValidate(
        createDto.to.toString(),
      );

      if (createDto.from) {
        return this.handleInternalTransfer(createDto, to, user, host);
      } else {
        return this.handleExternalDeposit(createDto, to, user, host);
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  private async handleInternalTransfer(
    createDto: WalletDepositCreateDto,
    to: any,
    user: User,
    host: string,
  ) {
    const from = await this.baseService.getWalletByIdAndValidate(
      createDto.from.toString(),
    );

    const [
      depositWalletCategory,
      withDrawalWalletCategory,
      approvedStatus,
      internalPspAccount,
    ] = await Promise.all([
      this.ewalletBuilder.getPromiseCategoryEventClient(
        EventsNamesCategoryEnum.findOneByNameType,
        {
          slug: 'deposit-wallet',
          type: TagEnum.MONETARY_TRANSACTION_TYPE,
        },
      ),
      this.ewalletBuilder.getPromiseCategoryEventClient(
        EventsNamesCategoryEnum.findOneByNameType,
        {
          slug: 'withdrawal-wallet',
          type: TagEnum.MONETARY_TRANSACTION_TYPE,
        },
      ),
      this.ewalletBuilder.getPromiseStatusEventClient(
        EventsNamesStatusEnum.findOneByName,
        'approved',
      ),
      this.ewalletBuilder.getPromisePspAccountEventClient(
        EventsNamesPspAccountEnum.findOneByName,
        'internal',
      ),
    ]);

    const result = await Promise.all([
      this.accountService.customUpdateOne({
        id: createDto.to,
        $inc: { amount: createDto.amount },
      }),
      this.accountService.customUpdateOne({
        id: createDto.from.toString(),
        $inc: { amount: createDto.amount * -1 },
      }),
    ]).then((list) => list[0]);

    await this.createTransferEvents(
      to,
      from,
      createDto,
      user,
      depositWalletCategory,
      withDrawalWalletCategory,
      approvedStatus,
      internalPspAccount,
      host,
    );

    return result;
  }

  private async handleExternalDeposit(
    createDto: WalletDepositCreateDto,
    to: any,
    user: User,
    host: string,
  ) {
    const transferBtn: TransferCreateButtonDto = {
      amount: createDto.amount.toString(),
      currency: 'USD',
      account: to._id.toString(),
      creator: user.id.toString(),
      details: 'Recharge in wallet',
      customer_name: user.name,
      customer_email: user.email,
      public_key: null,
      identifier: user._id.toString(),
    };

    try {
      let depositAddress = to.responseCreation;
      if (!depositAddress) {
        depositAddress =
          await this.ewalletBuilder.getPromiseTransferEventClient(
            EventsNamesTransferEnum.createOneDepositLink,
            transferBtn,
          );
        this.ewalletBuilder.emitAccountEventClient(
          EventsNamesAccountEnum.updateOne,
          {
            id: to._id,
            responseCreation: depositAddress,
          },
        );
        this.ewalletBuilder.emitAccountEventClient(
          EventsNamesAccountEnum.updateOne,
          {
            id: to._id,
            responseCreation: depositAddress,
          },
        );
      }

      const url = `https://${host}/transfers/deposit/page/${depositAddress?._id}`;
      const data = depositAddress?.responseAccount?.data;
      return {
        statusCode: 200,
        data: {
          txId: depositAddress?._id,
          url: `https://tronscan.org/#/address/${data?.attributes?.address}`,
          address: data?.attributes?.address,
          chain: 'TRON BLOCKCHAIN',
        },
      };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  private async createTransferEvents(
    to: any,
    from: any,
    createDto: WalletDepositCreateDto,
    user: User,
    depositWalletCategory: any,
    withDrawalWalletCategory: any,
    approvedStatus: any,
    internalPspAccount: any,
    host: string,
  ) {
    const commonTransferData = {
      currency: to.currency,
      amount: createDto.amount,
      currencyCustodial: to.currencyCustodial,
      amountCustodial: createDto.amount,
      userCreator: user.id,
      psp: internalPspAccount.psp,
      pspAccount: internalPspAccount._id,
      page: host,
      statusPayment: StatusCashierEnum.APPROVED,
      approve: true,
      status: approvedStatus._id,
      confirmedAt: new Date(),
      approvedAt: new Date(),
    };

    await Promise.all([
      this.ewalletBuilder.emitTransferEventClient(
        EventsNamesTransferEnum.createOne,
        {
          ...commonTransferData,
          name: `Recharge wallet ${to.name}`,
          description: `Recharge from wallet ${from.name} to card ${to.name}`,
          account: to._id,
          userAccount: to.owner,
          typeTransaction: depositWalletCategory._id,
          operationType: OperationTransactionType.deposit,
          brand: to.brand,
          crm: to.crm,
        } as unknown as TransferCreateDto,
      ),
      this.ewalletBuilder.emitTransferEventClient(
        EventsNamesTransferEnum.createOne,
        {
          ...commonTransferData,
          name: `Withdrawal wallet ${from.name}`,
          description: `Recharge from wallet ${from.name} to card ${to.name}`,
          account: from._id,
          userAccount: from.owner,
          typeTransaction: withDrawalWalletCategory._id,
          operationType: OperationTransactionType.withdrawal,
          brand: from.brand,
          crm: from.crm,
        } as unknown as TransferCreateDto,
      ),
    ]);
  }

  async sweepOmnibus(data: any) {
    return this.transactionService.sweepOmnibus(data);
  }

  async updateStatusAccount(
    id: string,
    slugName: StatusAccountEnum,
  ): Promise<AccountDocument> {
    return this.baseService.updateStatusAccount(id, slugName);
  }

  async toggleVisibleToOwner(
    id: string,
    visible?: boolean,
  ): Promise<AccountDocument> {
    return this.baseService.toggleVisibleToOwner(id, visible);
  }

  async lockWallet(id: string): Promise<AccountDocument> {
    return this.updateStatusAccount(id, StatusAccountEnum.LOCK);
  }

  async unlockWallet(id: string): Promise<AccountDocument> {
    return this.updateStatusAccount(id, StatusAccountEnum.UNLOCK);
  }

  async cancelWallet(id: string): Promise<AccountDocument> {
    return this.updateStatusAccount(id, StatusAccountEnum.CANCEL);
  }

  async validateWalletAccess(
    walletId: string,
    userId: string,
  ): Promise<boolean> {
    const wallet = await this.baseService.getWalletByIdAndValidate(
      walletId,
      userId,
    );
    return wallet !== null;
  }

  async getWalletBalance(walletId: string): Promise<number> {
    const wallet = await this.baseService.getWalletByIdAndValidate(walletId);
    return wallet.amount;
  }

  async handleWalletCreated(wallet: AccountDocument, user: User) {
    await this.notificationService.sendNotification(wallet, user);
    Logger.log(`Wallet created for user: ${user.id}`, 'WalletService');
  }

  async handleWalletUpdated(wallet: AccountDocument, previousBalance: number) {
    if (wallet.amount !== previousBalance) {
      await this.notificationService.sendBalanceUpdateNotification(
        wallet,
        previousBalance,
        wallet.amount,
      );
    }
  }

  private async validateWalletOperation(
    userId: string,
    walletId: string,
    amount: number,
  ): Promise<{ wallet: AccountDocument; user: User }> {
    const [wallet, user] = await Promise.all([
      this.baseService.getWalletByIdAndValidate(walletId, userId),
      this.userService
        .getAll({
          relations: ['personalData'],
          where: { _id: userId },
        })
        .then((response) => response.list[0]),
    ]);

    if (!user?.personalData) {
      throw new BadRequestException('Need the personal data to continue');
    }

    if (amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }

    return { wallet, user };
  }

  async getAvailableWallets(userId: string): Promise<AccountDocument[]> {
    const wallets = await this.findWallets({
      where: {
        owner: userId,
        showToOwner: true,
      },
    });
    return wallets.list;
  }

  async getWalletTransactions(walletId: string, query: any = {}): Promise<any> {
    const wallet = await this.baseService.getWalletByIdAndValidate(walletId);
    return {
      wallet,
      transactions: [],
    };
  }

  async getWalletStatistics(walletId: string): Promise<any> {
    const wallet = await this.findWalletById(walletId);
    return {
      totalTransactions: wallet.totalTransfer,
      currentBalance: wallet.amount,
      blockedAmount: wallet.amountBlocked,
      custodialAmount: wallet.amountCustodial,
      lastUpdated: wallet.updatedAt,
    };
  }
  async createWalletB2BinPay(
    createDto: WalletCreateDto,
    userId?: string,
  ): Promise<any> {
    return await this.b2binpayService.createWalletB2BinPay(createDto, userId);
  }

  async createWalletFireblocks(
    createDto: WalletCreateDto,
    userId: string,
  ): Promise<any> {
    return await this.fireblocksService.createWalletFireblocks(
      createDto,
      userId,
    );
  }
}
