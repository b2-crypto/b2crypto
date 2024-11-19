import { WalletDepositCreateDto } from '@account/account/dto/wallet-deposit.create.dto';
import { WalletCreateDto } from '@account/account/dto/wallet.create.dto';
import { AccountDocument } from '@account/account/entities/mongoose/account.schema';
import StatusAccountEnum from '@account/account/enum/status.account.enum';
import TypesAccountEnum from '@account/account/enum/types.account.enum';
import WalletTypesAccountEnum from '@account/account/enum/wallet.types.account.enum';
import { BuildersService } from '@builder/builders';
import { CommonService } from '@common/common';
import CountryCodeEnum from '@common/common/enums/country.code.b2crypto.enum';
import CurrencyCodeB2cryptoEnum from '@common/common/enums/currency-code-b2crypto.enum';
import { EnvironmentEnum } from '@common/common/enums/environment.enum';
import { StatusCashierEnum } from '@common/common/enums/StatusCashierEnum';
import TagEnum from '@common/common/enums/TagEnum';
import { IntegrationService } from '@integration/integration';
import IntegrationCryptoEnum from '@integration/integration/crypto/enums/IntegrationCryptoEnum';
import { FireblocksIntegrationService } from '@integration/integration/crypto/fireblocks/fireblocks-integration.service';
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TransferCreateDto } from '@transfer/transfer/dto/transfer.create.dto';
import { OperationTransactionType } from '@transfer/transfer/enum/operation.transaction.type.enum';
import { User } from '@user/user/entities/mongoose/user.schema';
import EventsNamesCategoryEnum from 'apps/category-service/src/enum/events.names.category.enum';
import EventsNamesCrmEnum from 'apps/crm-service/src/enum/events.names.crm.enum';
import EventsNamesMessageEnum from 'apps/message-service/src/enum/events.names.message.enum';
import EventsNamesPspAccountEnum from 'apps/psp-service/src/enum/events.names.psp.acount.enum';
import EventsNamesStatusEnum from 'apps/status-service/src/enum/events.names.status.enum';
import { TransferCreateButtonDto } from 'apps/transfer-service/src/dto/transfer.create.button.dto';
import EventsNamesTransferEnum from 'apps/transfer-service/src/enum/events.names.transfer.enum';
import { UserServiceService } from 'apps/user-service/src/user-service.service';
import { AccountServiceService } from './account-service.service';
import EventsNamesAccountEnum from './enum/events.names.account.enum';

@Injectable()
export class WalletServiceService {
  private cryptoType = null;

  constructor(
    @Inject(UserServiceService)
    private readonly userService: UserServiceService,
    @Inject(AccountServiceService)
    private readonly accountService: AccountServiceService,
    @Inject(BuildersService)
    private readonly ewalletBuilder: BuildersService,
    private readonly configService: ConfigService,
    private readonly integration: IntegrationService,
  ) {}

  async createWalletB2BinPay(createDto: WalletCreateDto, req?: any) {
    const userId = req?.user.id ?? createDto.owner;
    if (!userId) {
      throw new BadRequestException('Need the user id to continue');
    }

    const user: User = (
      await this.userService.getAll({
        relations: ['personalData'],
        where: { _id: userId },
      })
    ).list[0];

    if (!user.personalData) {
      throw new BadRequestException('Need the personal data to continue');
    }

    createDto.type = TypesAccountEnum.WALLET;
    createDto.accountId = '2177';
    createDto.accountName = 'CoxSQtiWAHVo';
    createDto.accountPassword = 'w7XDOfgfudBvRG';
    createDto.owner = user.id ?? user._id;
    createDto.pin =
      createDto.pin ??
      CommonService.getNumberDigits(CommonService.randomIntNumber(9999), 4);

    const createdWallet = await this.accountService.createOne(createDto);

    const emailData = {
      destinyText: user.email,
      vars: {
        name: user.name,
        accountType: createdWallet.accountType,
        accountName: createdWallet.accountName,
        balance: createdWallet.amount,
        currency: createdWallet.currency,
        accountId: createdWallet.accountId,
      },
    };

    const transferBtn: TransferCreateButtonDto = {
      amount: '999',
      currency: 'USDT',
      account: createdWallet.id ?? createdWallet._id,
      creator: createDto.owner,
      details: 'Deposit address',
      customer_name: user.name,
      customer_email: user.email,
      public_key: null,
      identifier: createDto.owner,
    };

    this.ewalletBuilder.emitMessageEventClient(
      EventsNamesMessageEnum.sendCryptoWalletsManagement,
      emailData,
    );

    if (process.env.ENVIRONMENT === EnvironmentEnum.prod) {
      this.ewalletBuilder.emitAccountEventClient(
        EventsNamesAccountEnum.updateOne,
        {
          id: createdWallet.id ?? createdWallet._id,
          responseCreation:
            await this.ewalletBuilder.getPromiseTransferEventClient(
              EventsNamesTransferEnum.createOneDepositLink,
              transferBtn,
            ),
        },
      );
    }

    return createdWallet;
  }

  async createWalletFireblocks(createDto: WalletCreateDto, req?: any) {
    const userId = createDto.owner ?? req?.user.id;
    if (!userId) {
      throw new BadRequestException('Need the user id to continue');
    }

    const user: User = await this.userService.getOne(userId, ['personalData']);

    if (!user.personalData) {
      throw new BadRequestException('Need the personal data to continue');
    }

    const fireblocksCrm = await this.ewalletBuilder.getPromiseCrmEventClient(
      EventsNamesCrmEnum.findOneByName,
      IntegrationCryptoEnum.FIREBLOCKS,
    );

    const walletBase = await this.getWalletBase(
      fireblocksCrm._id,
      createDto.name,
    );
    if (EnvironmentEnum.prod === this.configService.get('ENVIRONMENT')) {
      const vaultUser = await this.getVaultUser(
        // req.clientApi,
        userId,
        fireblocksCrm._id,
        walletBase,
        createDto.brand,
      );
      createDto.type = TypesAccountEnum.WALLET;
      createDto.accountName = walletBase.accountName;
      createDto.nativeAccountName = walletBase.nativeAccountName;
      createDto.accountId = walletBase.accountId;
      createDto.crm = fireblocksCrm;
      createDto.owner = user.id ?? user._id;
      const createdWallet = await this.getWalletUser(
        createDto,
        userId,
        fireblocksCrm._id,
        vaultUser,
      );

      this.sendNotification(createdWallet, user);

      return createdWallet;
    }
    throw new BadRequestException('Only work in Prod');
  }

  private async getWalletBase(fireblocksCrmId: string, nameWallet: string) {
    const walletBase = (
      await this.accountService.availableWalletsFireblocks({
        where: {
          crm: fireblocksCrmId,
          name: nameWallet,
          showToOwner: false,
          owner: {
            $exists: false,
          },
        },
      })
    ).list[0];
    if (!walletBase) {
      throw new BadRequestException(
        `The wallet ${nameWallet} is not available`,
      );
    }

    return walletBase;
  }

  async getVaultUser(
    userId: string,
    fireblocksCrmId: string,
    walletBase: AccountDocument,
    brandId: string,
  ) {
    const vaultUserList = await this.accountService.findAll({
      where: {
        name: `${userId}-vault`,
        accountType: WalletTypesAccountEnum.VAULT,
        crm: fireblocksCrmId,
        showToOwner: false,
        owner: userId,
      },
    });
    let vaultUser = vaultUserList.list[0];
    if (!vaultUser) {
      const cryptoType = await this.getFireblocksType();
      const newVault = await cryptoType.createVault(`${userId}-vault`);
      vaultUser = await this.accountService.createOne({
        afgId: '',
        name: `${userId}-vault`,
        slug: `${userId}-vault`,
        owner: userId,
        accountType: WalletTypesAccountEnum.VAULT,
        crm: fireblocksCrmId,
        accountId: newVault.id,
        accountName: walletBase.accountName,
        showToOwner: false,
        pin: CommonService.getNumberDigits(
          CommonService.randomIntNumber(9999),
          4,
        ),
        responseCreation: newVault,
        id: undefined,
        type: TypesAccountEnum.WALLET,
        searchText: '',
        docId: '',
        secret: '',
        address: null,
        email: '',
        telephone: '',
        description: '',
        decimals: walletBase.decimals,
        hasSendDisclaimer: false,
        referral: walletBase.referral,
        protocol: walletBase.protocol,
        country: CountryCodeEnum.Colombia,
        personalData: undefined,
        brand: brandId,
        affiliate: undefined,
        totalTransfer: 0,
        quantityTransfer: 0,
        statusText: StatusAccountEnum.VISIBLE,
        accountStatus: [],
        createdAt: undefined,
        updatedAt: undefined,
        cardConfig: undefined,
        amount: 0,
        currency: CurrencyCodeB2cryptoEnum.USDT,
        amountCustodial: 0,
        currencyCustodial: CurrencyCodeB2cryptoEnum.USDT,
        amountBlocked: 0,
        currencyBlocked: CurrencyCodeB2cryptoEnum.USDT,
        amountBlockedCustodial: 0,
        currencyBlockedCustodial: CurrencyCodeB2cryptoEnum.USDT,
      });
    }

    return vaultUser;
  }

  private async getWalletUser(
    dtoWallet: WalletCreateDto,
    userId: string,
    fireblocksCrmId: string,
    vaultUser: AccountDocument,
  ) {
    const walletName = `${dtoWallet.name}-${userId}`;
    let walletUser = (
      await this.accountService.findAll({
        where: {
          name: walletName,
          owner: userId,
          accountType: WalletTypesAccountEnum.VAULT,
          crm: fireblocksCrmId,
          showToOwner: true,
          brand: dtoWallet.brand,
          referral: vaultUser.id,
        },
      })
    ).list[0];
    if (!walletUser) {
      // Create one with showToOwner in false and type in VAULT
      const cryptoType = await this.getFireblocksType();
      const newWallet = await cryptoType.createWallet(
        vaultUser.accountId,
        dtoWallet.accountId,
        // walletName,
        // userId,
      );
      if (!newWallet) {
        throw new BadRequestException('Error creating new wallet');
      }
      dtoWallet.responseCreation = newWallet;
      dtoWallet.showToOwner = true;
      dtoWallet.accountName = newWallet.address;
      dtoWallet.pin =
        dtoWallet.pin ??
        CommonService.getNumberDigits(CommonService.randomIntNumber(9999), 4);
      dtoWallet.accountType = WalletTypesAccountEnum.VAULT;

      walletUser = await this.accountService.createOne(dtoWallet);
    }

    return walletUser;
  }

  async getFireblocksType(): Promise<FireblocksIntegrationService> {
    if (!this.cryptoType) {
      this.cryptoType = this.integration.getCryptoIntegration(
        null,
        IntegrationCryptoEnum.FIREBLOCKS,
        '',
      );
    }
    return this.cryptoType;
  }

  async sendNotification(createdWallet: any, user: User) {
    Logger.debug('Sending notification new wallet');
    const emailData = {
      destinyText: user.email,
      vars: {
        name: user.name,
        accountType: createdWallet.accountType,
        accountName: createdWallet.accountName,
        balance: createdWallet.amount,
        currency: createdWallet.currency,
        accountId: createdWallet.accountId,
      },
    };

    this.ewalletBuilder.emitMessageEventClient(
      EventsNamesMessageEnum.sendCryptoWalletsManagement,
      emailData,
    );

    if (!createdWallet.crm) {
      const transferBtn: TransferCreateButtonDto = {
        amount: '999',
        currency: 'USDT',
        account: createdWallet.id ?? createdWallet._id,
        creator: createdWallet.owner,
        details: 'Deposit address',
        customer_name: user.name,
        customer_email: user.email,
        public_key: null,
        identifier: createdWallet.owner,
      };

      this.ewalletBuilder.emitAccountEventClient(
        EventsNamesAccountEnum.updateOne,
        {
          id: createdWallet.id ?? createdWallet._id,
          responseCreation:
            await this.ewalletBuilder.getPromiseTransferEventClient(
              EventsNamesTransferEnum.createOneDepositLink,
              transferBtn,
            ),
        },
      );
    }
  }

  async rechargeWallet(
    createDto: WalletDepositCreateDto,
    userId: string,
    host: string,
  ) {
    const user: User = (
      await this.userService.getAll({
        relations: ['personalData'],
        where: { _id: userId },
      })
    ).list[0];

    if (!user.personalData) {
      throw new BadRequestException('Need the personal data to continue');
    }
    if (createDto.amount <= 10) {
      throw new BadRequestException('The recharge not be 10 or less');
    }

    const to = await this.accountService.findOneById(createDto.to.toString());
    if (to.type != TypesAccountEnum.WALLET) {
      throw new BadRequestException('Wallet not found');
    }

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
    const from = await this.accountService.findOneById(
      createDto.from.toString(),
    );
    if (from.type != TypesAccountEnum.WALLET) {
      throw new BadRequestException('Wallet not found');
    }

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

  async createWallet(
    createDto: WalletCreateDto,
    userId?: string,
  ): Promise<any> {
    userId = userId ?? createDto.owner;
    if (!userId) {
      throw new BadRequestException('Need the user id to continue');
    }

    const user: User = (
      await this.userService.getAll({
        relations: ['personalData'],
        where: { _id: userId },
      })
    ).list[0];

    if (!user.personalData) {
      throw new BadRequestException('Need the personal data to continue');
    }

    createDto.type = TypesAccountEnum.WALLET;
    createDto.accountId = '2177';
    createDto.accountName = 'CoxSQtiWAHVo';
    createDto.accountPassword = 'w7XDOfgfudBvRG';
    createDto.owner = user.id ?? user._id;
    createDto.pin =
      createDto.pin ??
      CommonService.getNumberDigits(CommonService.randomIntNumber(9999), 4);

    const createdWallet = await this.accountService.createOne(createDto);

    const emailData = {
      destinyText: user.email,
      vars: {
        name: user.name,
        accountType: createdWallet.accountType,
        accountName: createdWallet.accountName,
        balance: createdWallet.amount,
        currency: createdWallet.currency,
        accountId: createdWallet.accountId,
      },
    };

    const transferBtn: TransferCreateButtonDto = {
      amount: '999',
      currency: 'USD',
      account: createdWallet.id ?? createdWallet._id,
      creator: createDto.owner,
      details: 'Deposit address',
      customer_name: user.name,
      customer_email: user.email,
      public_key: null,
      identifier: createDto.owner,
    };

    this.ewalletBuilder.emitMessageEventClient(
      EventsNamesMessageEnum.sendCryptoWalletsManagement,
      emailData,
    );

    if (process.env.ENVIRONMENT === EnvironmentEnum.prod) {
      this.ewalletBuilder.emitAccountEventClient(
        EventsNamesAccountEnum.updateOne,
        {
          id: createdWallet.id ?? createdWallet._id,
          responseCreation:
            await this.ewalletBuilder.getPromiseTransferEventClient(
              EventsNamesTransferEnum.createOneDepositLink,
              transferBtn,
            ),
        },
      );
    }

    return createdWallet;
  }
}
