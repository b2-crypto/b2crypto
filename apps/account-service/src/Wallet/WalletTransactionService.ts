import {
  Injectable,
  Inject,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { WalletDepositCreateDto } from '@account/account/dto/wallet-deposit.create.dto';
import { AccountServiceService } from '../account-service.service';
import { BuildersService } from '@builder/builders';
import TypesAccountEnum from '@account/account/enum/types.account.enum';
import EventsNamesCategoryEnum from 'apps/category-service/src/enum/events.names.category.enum';
import EventsNamesPspAccountEnum from 'apps/psp-service/src/enum/events.names.psp.acount.enum';
import EventsNamesStatusEnum from 'apps/status-service/src/enum/events.names.status.enum';
import EventsNamesTransferEnum from 'apps/transfer-service/src/enum/events.names.transfer.enum';
import EventsNamesAccountEnum from '../enum/events.names.account.enum';
import { TransferCreateButtonDto } from 'apps/transfer-service/src/dto/transfer.create.button.dto';
import { TransferCreateDto } from '@transfer/transfer/dto/transfer.create.dto';
import { OperationTransactionType } from '@transfer/transfer/enum/operation.transaction.type.enum';
import { StatusCashierEnum } from '@common/common/enums/StatusCashierEnum';
import TagEnum from '@common/common/enums/TagEnum';
import { User } from '@user/user/entities/mongoose/user.schema';
import { AccountEntity } from '@account/account/entities/account.entity';
import WalletTypesAccountEnum from '@account/account/enum/wallet.types.account.enum';
import { ResponsePaginator } from '@common/common/interfaces/response-pagination.interface';
import EventsNamesCrmEnum from 'apps/crm-service/src/enum/events.names.crm.enum';
import IntegrationCryptoEnum from '@integration/integration/crypto/enums/IntegrationCryptoEnum';
import { WalletBaseService } from './WalletBaseService';
import { WalletFireblocksService } from './WalletFireblocksService';

@Injectable()
export class WalletTransactionService {
  constructor(
    @Inject(AccountServiceService)
    private readonly accountService: AccountServiceService,
    @Inject(BuildersService)
    private readonly ewalletBuilder: BuildersService,
    @Inject(WalletBaseService)
    private readonly baseService: WalletBaseService,
    @Inject(WalletFireblocksService)
    private readonly fireblocksService: WalletFireblocksService,
  ) {}

  async rechargeWallet(
    createDto: WalletDepositCreateDto,
    userId: string,
    host: string,
  ) {
    const user = await this.baseService.getUser(userId);

    if (createDto.amount <= 10) {
      throw new BadRequestException('The recharge not be 10 or less');
    }

    const to = await this.baseService.getWalletByIdAndValidate(
      createDto.to.toString(),
    );

    if (createDto.from) {
      return this.handleInternalTransfer(createDto, to, user, host);
    } else {
      return this.handleExternalDeposit(createDto, to, user, host);
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

    this.createTransferEvents(
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
      }

      const url = `https://${host}/transfers/deposit/page/${depositAddress?._id}`;
      const data = depositAddress.responseAccount.data;
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

  private createTransferEvents(
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
    );

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
    );
  }

  async sweepOmnibus(data: any) {
    const fireblocksCrm = await this.ewalletBuilder.getPromiseCrmEventClient(
      EventsNamesCrmEnum.findOneByName,
      IntegrationCryptoEnum.FIREBLOCKS,
    );
    const cryptoType = await this.fireblocksService.getFireblocksType();
    const walletsBase = {};
    const valuts = {};
    const wallets = {};
    const promises = [];
    let walletList: ResponsePaginator<AccountEntity> = null;

    do {
      walletList = await this.ewalletBuilder.getPromiseAccountEventClient(
        EventsNamesAccountEnum.findAll,
        {
          page: walletList?.nextPage || 1,
          where: {
            owner: { $exists: true },
            type: TypesAccountEnum.WALLET,
            accountType: WalletTypesAccountEnum.VAULT,
            amountCustodial: { $gt: 0 },
          },
        },
      );

      for (const from of walletList.list) {
        await this.processSweepWallet(
          from,
          walletsBase,
          valuts,
          wallets,
          fireblocksCrm,
          cryptoType,
          promises,
        );
      }
    } while (walletList.nextPage != 1);

    return Promise.all(promises);
  }

  private async processSweepWallet(
    from: AccountEntity,
    walletsBase: any,
    valuts: any,
    wallets: any,
    fireblocksCrm: any,
    cryptoType: any,
    promises: any[],
  ) {
    if (!walletsBase[from.name]) {
      walletsBase[from.name] = await this.fireblocksService.getWalletBase(
        fireblocksCrm._id,
        from.name,
      );
    }

    const walletBase = walletsBase[from.name];
    const brandId = from.brand.toString();
    const valueToDeposit = from.amountCustodial * 0.8;
    const valueToWithdraw = from.amountCustodial * 0.2;

    if (!valuts[brandId]) {
      valuts[brandId] = await this.getVaultPair(
        fireblocksCrm._id,
        walletBase,
        brandId,
      );
    }

    if (!wallets[brandId]) {
      wallets[brandId] = await this.getWalletPair(
        walletBase,
        fireblocksCrm._id,
        valuts[brandId],
      );
    }

    const vaultFrom = await this.fireblocksService.getVaultUser(
      from.owner.toString(),
      fireblocksCrm._id,
      walletBase,
      brandId,
    );

    await this.createSweepTransactions(
      from,
      vaultFrom,
      valuts[brandId],
      wallets[brandId],
      valueToDeposit,
      valueToWithdraw,
      cryptoType,
      promises,
    );
  }

  private async getVaultPair(
    fireblocksCrmId: string,
    walletBase: any,
    brandId: string,
  ) {
    return {
      deposit: await this.fireblocksService.getVaultBrand(
        fireblocksCrmId,
        walletBase,
        brandId,
        WalletTypesAccountEnum.VAULT_D,
      ),
      withdraw: await this.fireblocksService.getVaultBrand(
        fireblocksCrmId,
        walletBase,
        brandId,
        WalletTypesAccountEnum.VAULT_W,
      ),
    };
  }

  private async getWalletPair(
    walletBase: any,
    fireblocksCrmId: string,
    vaults: any,
  ) {
    return {
      deposit: await this.fireblocksService.getWallet(
        walletBase,
        fireblocksCrmId,
        vaults.deposit,
        WalletTypesAccountEnum.VAULT_D,
      ),
      withdraw: await this.fireblocksService.getWallet(
        walletBase,
        fireblocksCrmId,
        vaults.withdraw,
        WalletTypesAccountEnum.VAULT_W,
      ),
    };
  }

  private async createSweepTransactions(
    from: AccountEntity,
    vaultFrom: any,
    valuts: any,
    wallets: any,
    valueToDeposit: number,
    valueToWithdraw: number,
    cryptoType: any,
    promises: any[],
  ) {
    promises.push(
      this.createDepositTransaction(
        from,
        vaultFrom,
        valuts,
        wallets,
        valueToDeposit,
        cryptoType,
      ),
      this.createWithdrawTransaction(
        from,
        vaultFrom,
        valuts,
        wallets,
        valueToWithdraw,
        cryptoType,
      ),
    );
  }

  private async createDepositTransaction(
    from: any,
    vaultFrom: any,
    valuts: any,
    wallets: any,
    value: number,
    cryptoType: any,
  ) {
    return cryptoType
      .createTransaction(
        from.accountId,
        String(value),
        vaultFrom.accountId,
        valuts.deposit.accountId,
      )
      .catch((err) => {
        Logger.error(
          err,
          `Sweep deposit error: ${vaultFrom.name}_${from.name}`,
        );
        return null;
      })
      .then((rta) => this.updateBalances(from, wallets.deposit, value));
  }

  private async createWithdrawTransaction(
    from: any,
    vaultFrom: any,
    valuts: any,
    wallets: any,
    value: number,
    cryptoType: any,
  ) {
    return cryptoType
      .createTransaction(
        from.accountId,
        String(value),
        vaultFrom.accountId,
        valuts.withdraw.accountId,
      )
      .catch((err) => {
        Logger.error(
          err,
          `Sweep withdrawal error: ${vaultFrom.name}_${from.name}`,
        );
        return null;
      })
      .then((rta) => this.updateBalances(from, wallets.withdraw, value));
  }

  private async updateBalances(from: any, wallet: any, value: number) {
    return Promise.all([
      this.accountService.customUpdateOne({
        id: from._id,
        $inc: { amountCustodial: value * -1 },
      }),
      this.accountService.customUpdateOne({
        id: wallet._id,
        $inc: { amountCustodial: value },
      }),
    ]);
  }
}
