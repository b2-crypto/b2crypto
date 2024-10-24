import { WalletDepositCreateDto } from '@account/account/dto/wallet-deposit.create.dto';
import { WalletCreateDto } from '@account/account/dto/wallet.create.dto';
import { AccountDocument } from '@account/account/entities/mongoose/account.schema';
import StatusAccountEnum from '@account/account/enum/status.account.enum';
import TypesAccountEnum from '@account/account/enum/types.account.enum';
import WalletTypesAccountEnum from '@account/account/enum/wallet.types.account.enum';
import { ApiKeyAuthGuard } from '@auth/auth/guards/api.key.guard';
import { JwtAuthGuard } from '@auth/auth/guards/jwt-auth.guard';
import { BuildersService } from '@builder/builders';
import { CommonService } from '@common/common';
import { NoCache } from '@common/common/decorators/no-cache.decorator';
import CountryCodeEnum from '@common/common/enums/country.code.b2crypto.enum';
import CurrencyCodeB2cryptoEnum from '@common/common/enums/currency-code-b2crypto.enum';
import { EnvironmentEnum } from '@common/common/enums/environment.enum';
import { StatusCashierEnum } from '@common/common/enums/StatusCashierEnum';
import TagEnum from '@common/common/enums/TagEnum';
import { QuerySearchAnyDto } from '@common/common/models/query_search-any.dto';
import { IntegrationService } from '@integration/integration';
import IntegrationCryptoEnum from '@integration/integration/crypto/enums/IntegrationCryptoEnum';
import { FireblocksIntegrationService } from '@integration/integration/crypto/fireblocks/fireblocks-integration.service';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Logger,
  NotImplementedException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import {
  ApiBearerAuth,
  ApiExcludeEndpoint,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
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
import { SwaggerSteakeyConfigEnum } from 'libs/config/enum/swagger.stakey.config.enum';
import { AccountServiceController } from './account-service.controller';
import { AccountServiceService } from './account-service.service';
import EventsNamesAccountEnum from './enum/events.names.account.enum';
import { ConfigService } from '@nestjs/config';
import { isMongoId } from 'class-validator';
import { AccountEntity } from '@account/account/entities/account.entity';
import { CategoryDocument } from '@category/category/entities/mongoose/category.schema';
import { ResponsePaginator } from '@common/common/interfaces/response-pagination.interface';

@ApiTags(SwaggerSteakeyConfigEnum.TAG_WALLET)
@Controller('wallets')
export class WalletServiceController extends AccountServiceController {
  private cryptoType = null;
  constructor(
    readonly walletService: AccountServiceService,
    @Inject(UserServiceService)
    private readonly userService: UserServiceService,
    @Inject(BuildersService)
    readonly ewalletBuilder: BuildersService,
    private readonly integration: IntegrationService,
    private readonly configService: ConfigService,
  ) {
    super(walletService, ewalletBuilder);
    this.getFireblocksType();
  }

  private async getFireblocksType(): Promise<FireblocksIntegrationService> {
    if (!this.cryptoType) {
      this.cryptoType = this.integration.getCryptoIntegration(
        null,
        IntegrationCryptoEnum.FIREBLOCKS,
        '',
      );
    }
    return this.cryptoType;
  }

  @ApiExcludeEndpoint()
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_WALLET)
  @ApiBearerAuth('bearerToken')
  @ApiSecurity('b2crypto-key')
  @Get('all')
  @NoCache()
  findAll(@Query() query: QuerySearchAnyDto, @Req() req?: any) {
    const client = req.clientApi;
    query = query ?? {};
    query.where = query.where ?? {};
    query.where.type = TypesAccountEnum.WALLET;
    query.where.showToOwner = true;
    return this.walletService.findAll(query);
  }

  @ApiExcludeEndpoint()
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_WALLET)
  @ApiBearerAuth('bearerToken')
  @ApiSecurity('b2crypto-key')
  @Get('me')
  @NoCache()
  async findAllMe(@Query() query: QuerySearchAnyDto, @Req() req?: any) {
    const userId = CommonService.getUserId(req);
    query = query ?? {};
    query.where = query.where ?? {};
    query.where.type = TypesAccountEnum.WALLET;
    query.where.showToOwner = true;
    query = CommonService.getQueryWithUserId(query, req, 'owner');
    const rta = await this.walletService.findAll({
      where: {
        owner: userId,
        type: TypesAccountEnum.WALLET,
        showToOwner: true,
      },
    });
    if (rta.totalElements == 0) {
      await this.createOne(
        {
          owner: query.where.owner,
          name: 'USD Tether (Tron)',
          accountType: WalletTypesAccountEnum.VAULT,
          type: TypesAccountEnum.WALLET,
          pin: 0,
          id: undefined,
          slug: '',
          searchText: '',
          docId: '',
          secret: '',
          address: null,
          email: '',
          telephone: '',
          description: '',
          decimals: 0,
          hasSendDisclaimer: false,
          totalTransfer: 0,
          quantityTransfer: 0,
          showToOwner: false,
          statusText: StatusAccountEnum.UNLOCK,
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
        },
        req,
      );
    }
    return this.walletService.findAll(query);
  }

  @Get('availables')
  @UseGuards(ApiKeyAuthGuard)
  @NoCache()
  availablesWallet(@Query() query: QuerySearchAnyDto, @Req() req?: any) {
    query = query ?? {};
    query.where = query.where ?? {};
    query.where.type = TypesAccountEnum.WALLET;
    query.where.brand = req.user.brand;
    return this.walletService.availableWalletsFireblocks(query);
  }

  @Get('clean')
  @UseGuards(ApiKeyAuthGuard, JwtAuthGuard)
  @NoCache()
  cleanWallet(@Query() query: QuerySearchAnyDto, @Req() req?: any) {
    throw new NotImplementedException();
    //return this.walletService.cleanWallet(query);
  }

  @ApiTags(SwaggerSteakeyConfigEnum.TAG_WALLET)
  @ApiBearerAuth('bearerToken')
  @ApiSecurity('b2crypto-key')
  @Post('create')
  @UseGuards(ApiKeyAuthGuard, JwtAuthGuard)
  async createOne(@Body() createDto: WalletCreateDto, @Req() req?: any) {
    let rta = null;
    createDto.brand = req.user.brand;
    switch (createDto.accountType) {
      case WalletTypesAccountEnum.EWALLET:
        rta = this.createWalletB2BinPay(createDto, req);
        break;
      case WalletTypesAccountEnum.VAULT:
        rta = this.createWalletFireblocks(createDto, req);
        break;
      default:
        throw new BadRequestException(
          `The accountType ${createDto.accountType} is not valid`,
        );
    }
    return rta;
  }

  private async createWalletFireblocks(createDto: WalletCreateDto, req?: any) {
    const userId = createDto.owner ?? req?.user.id;
    if (!userId) {
      throw new BadRequestException('Need the user id to continue');
    }

    const user: User = await this.getUser(userId);

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

  private async sendNotification(createdWallet: any, user: User) {
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

  private async getWalletUser(
    dtoWallet: WalletCreateDto,
    userId: string,
    fireblocksCrmId: string,
    vaultUser: AccountDocument,
  ) {
    const walletName = `${dtoWallet.name}-${userId}`;
    let walletUser = (
      await this.walletService.findAll({
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
        parseInt(
          CommonService.getNumberDigits(CommonService.randomIntNumber(9999), 4),
        );
      dtoWallet.accountType = WalletTypesAccountEnum.VAULT;

      walletUser = await this.walletService.createOne(dtoWallet);
    }

    return walletUser;
  }

  private async getWalletBrand(
    dtoWallet: WalletCreateDto,
    fireblocksCrmId: string,
    vaultBrand: AccountDocument,
    brandId: string,
    accountType = WalletTypesAccountEnum.VAULT,
  ) {
    const walletName = `${dtoWallet.name}-${brandId}-${accountType}`;
    let walletUser = (
      await this.walletService.findAll({
        where: {
          name: walletName,
          type: TypesAccountEnum.WALLET,
          accountType,
          crm: fireblocksCrmId,
          showToOwner: true,
          brand: dtoWallet.brand,
          referral: vaultBrand.id,
        },
      })
    ).list[0];
    if (!walletUser) {
      // Create one with showToOwner in false and type in VAULT
      const cryptoType = await this.getFireblocksType();
      const newWallet = await cryptoType.createWallet(
        vaultBrand.accountId,
        dtoWallet.accountId,
        // walletName,
        // userId,
      );
      if (!newWallet) {
        throw new BadRequestException('Error creating new wallet');
      }
      dtoWallet.responseCreation = newWallet;
      dtoWallet.showToOwner = true;
      dtoWallet.brand = brandId;
      dtoWallet.accountName = newWallet.address;
      dtoWallet.pin =
        dtoWallet.pin ??
        parseInt(
          CommonService.getNumberDigits(CommonService.randomIntNumber(9999), 4),
        );
      dtoWallet.accountType = WalletTypesAccountEnum.VAULT;

      walletUser = await this.walletService.createOne(dtoWallet);
    }

    return walletUser;
  }

  private async getVaultUser(
    userId: string,
    fireblocksCrmId: string,
    walletBase: AccountDocument,
    brandId: string,
  ) {
    const vaultUserList = await this.walletService.findAll({
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
      vaultUser = await this.walletService.createOne({
        name: `${userId}-vault`,
        slug: `${userId}-vault`,
        owner: userId,
        accountType: WalletTypesAccountEnum.VAULT,
        crm: fireblocksCrmId,
        accountId: newVault.id,
        accountName: walletBase.accountName,
        showToOwner: false,
        pin: parseInt(
          CommonService.getNumberDigits(CommonService.randomIntNumber(9999), 4),
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
  private async getVaultBrand(
    fireblocksCrmId: string,
    walletBase: AccountDocument,
    brandId: string,
    accountType = WalletTypesAccountEnum.VAULT,
  ) {
    const vaultName = `${brandId}-vault-${accountType}`;
    let vaultBrand = (
      await this.walletService.findAll({
        where: {
          name: vaultName,
          brand: brandId,
          type: TypesAccountEnum.WALLET,
          accountType,
          crm: fireblocksCrmId,
          showToOwner: false,
          owner: {
            $exists: false,
          },
        },
      })
    ).list[0];
    if (!vaultBrand) {
      const cryptoType = await this.getFireblocksType();
      const newVault = await cryptoType.createVault(vaultName);
      vaultBrand = await this.walletService.createOne({
        name: vaultName,
        slug: `${brandId}-vault`,
        owner: undefined,
        accountType,
        crm: fireblocksCrmId,
        accountId: newVault.id,
        accountName: walletBase.accountName,
        showToOwner: false,
        pin: parseInt(
          CommonService.getNumberDigits(CommonService.randomIntNumber(9999), 4),
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
        statusText: StatusAccountEnum.HIDDEN,
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

    return vaultBrand;
  }

  private async getWalletBase(fireblocksCrmId: string, nameWallet: string) {
    const walletBase = (
      await this.walletService.availableWalletsFireblocks({
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

  public async getUser(userId): Promise<User> {
    const user = (
      await this.userService.getAll({
        relations: ['personalData'],
        where: { _id: userId },
      })
    ).list[0];
    if (!user.personalData) {
      throw new BadRequestException('Need the personal data to continue');
    }
    return user;
  }

  private async createWalletB2BinPay(createDto: WalletCreateDto, req?: any) {
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
      parseInt(
        CommonService.getNumberDigits(CommonService.randomIntNumber(9999), 4),
      );

    const createdWallet = await this.walletService.createOne(createDto);

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

  @Post('recharge')
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_WALLET)
  @ApiSecurity('b2crypto-key')
  @ApiBearerAuth('bearerToken')
  @UseGuards(ApiKeyAuthGuard)
  async rechargeOne(
    @Body() createDto: WalletDepositCreateDto,
    @Req() req?: any,
  ) {
    const user: User = (
      await this.userService.getAll({
        relations: ['personalData'],
        where: {
          _id: req?.user.id,
        },
      })
    ).list[0];
    if (!user.personalData) {
      throw new BadRequestException('Need the personal data to continue');
    }
    if (createDto.amount <= 10) {
      throw new BadRequestException('The operation not be less to 11');
    }
    if (!createDto.to && !createDto.from) {
      throw new BadRequestException('Need from and/or to wallet');
    }
    let to = null;
    if (isMongoId(createDto.to.toString())) {
      to = await this.getAccountService().findOneById(createDto.to.toString());
    }
    if (!createDto.from && to?.type != TypesAccountEnum.WALLET) {
      throw new BadRequestException('Wallet to not found');
    }
    if (createDto.from) {
      const from = await this.getAccountService().findOneById(
        createDto.from.toString(),
      );
      if (from.type != TypesAccountEnum.WALLET) {
        throw new BadRequestException('Wallet from not found');
      }
      const costTx = 5;
      const comisionTx = 0.03;
      const valueToPay = createDto.amount * comisionTx + costTx;
      if (from.amount < createDto.amount + valueToPay) {
        throw new BadRequestException(`Not enough balance`);
      }
      const depositWalletCategory =
        await this.ewalletBuilder.getPromiseCategoryEventClient(
          EventsNamesCategoryEnum.findOneByNameType,
          {
            slug: 'deposit-wallet',
            type: TagEnum.MONETARY_TRANSACTION_TYPE,
          },
        );
      const withdrawalWalletCategory =
        await this.ewalletBuilder.getPromiseCategoryEventClient(
          EventsNamesCategoryEnum.findOneByNameType,
          {
            slug: 'withdrawal-wallet',
            type: TagEnum.MONETARY_TRANSACTION_TYPE,
          },
        );
      const paymentWalletCategory =
        await this.ewalletBuilder.getPromiseCategoryEventClient(
          EventsNamesCategoryEnum.findOneByNameType,
          {
            slug: 'payment-wallet',
            type: TagEnum.MONETARY_TRANSACTION_TYPE,
          },
        );
      const purchaseWalletCategory =
        await this.ewalletBuilder.getPromiseCategoryEventClient(
          EventsNamesCategoryEnum.findOneByNameType,
          {
            slug: 'purchase-wallet',
            type: TagEnum.MONETARY_TRANSACTION_TYPE,
          },
        );
      if (
        !depositWalletCategory ||
        !withdrawalWalletCategory ||
        !paymentWalletCategory ||
        !purchaseWalletCategory
      ) {
        if (!depositWalletCategory) {
          throw new BadRequestException(
            'Monetary transaction type "deposit wallet" not found',
          );
        }
        if (!withdrawalWalletCategory) {
          throw new BadRequestException(
            'Monetary transaction type "withdrawal wallet" not found',
          );
        }
        if (!paymentWalletCategory) {
          throw new BadRequestException(
            'Monetary transaction type "payment wallet" not found',
          );
        }
        if (!purchaseWalletCategory) {
          throw new BadRequestException(
            'Monetary transaction type "purchase wallet" not found',
          );
        }
      }
      const approvedStatus =
        await this.ewalletBuilder.getPromiseStatusEventClient(
          EventsNamesStatusEnum.findOneByName,
          'approved',
        );
      const pendingStatus =
        await this.ewalletBuilder.getPromiseStatusEventClient(
          EventsNamesStatusEnum.findOneByName,
          'pending',
        );
      const internalPspAccount =
        await this.ewalletBuilder.getPromisePspAccountEventClient(
          EventsNamesPspAccountEnum.findOneByName,
          'internal',
        );
      const fireblocksCrm = await this.ewalletBuilder.getPromiseCrmEventClient(
        EventsNamesCrmEnum.findOneByName,
        IntegrationCryptoEnum.FIREBLOCKS,
      );
      const walletBase = await this.getWalletBase(fireblocksCrm._id, from.name);
      const vaultFrom = await this.getVaultUser(
        from.owner.toString(),
        fireblocksCrm._id,
        walletBase,
        from.brand.toString(),
      );
      const cryptoType = await this.getFireblocksType();
      let rta = null;
      try {
        const vaultBrandDeposit = await this.getVaultBrand(
          fireblocksCrm._id,
          walletBase,
          from.brand.toString(),
          WalletTypesAccountEnum.VAULT_D,
        );
        const dtoWallet = new WalletCreateDto();
        dtoWallet.name = walletBase.name;
        dtoWallet.type = TypesAccountEnum.WALLET;
        dtoWallet.accountType = WalletTypesAccountEnum.VAULT_W;
        dtoWallet.accountName = walletBase.accountName;
        dtoWallet.nativeAccountName = walletBase.nativeAccountName;
        dtoWallet.accountId = walletBase.accountId;
        dtoWallet.crm = fireblocksCrm;
        dtoWallet.owner = user.id ?? user._id;
        const walletBrandDeposit = await this.getWalletBrand(
          dtoWallet,
          fireblocksCrm._id,
          vaultBrandDeposit,
          String(from.brand),
          WalletTypesAccountEnum.VAULT_W,
        );
        if (from.amountCustodial > createDto.amount) {
          const promisesTx = [];
          if (to?._id) {
            const vaultTo = await this.getVaultUser(
              to.owner.toString(),
              fireblocksCrm._id,
              walletBase,
              to.brand.toString(),
            );
            rta = await cryptoType.createTransaction(
              from.accountId,
              String(createDto.amount),
              vaultFrom.accountId,
              vaultTo.accountId,
            );
            Logger.debug(JSON.stringify(rta.data, null, 2), 'rta from -> to');
            promisesTx.push(
              this.walletService.customUpdateOne({
                id: to._id,
                $inc: {
                  amountCustodial: createDto.amount,
                },
              }),
            );
          } else {
            rta = await cryptoType.createTransaction(
              from.accountId,
              String(createDto.amount),
              vaultFrom.accountId,
              createDto.to.toString(),
              'Withdrawal',
              true,
            );
            Logger.debug(JSON.stringify(rta.data, null, 2), 'rta from -> to?');
          }
          promisesTx.push(
            this.walletService.customUpdateOne({
              id: from._id,
              $inc: {
                amountCustodial: createDto.amount * -1,
              },
            }),
          );
          promisesTx.push(
            this.payByServicesFromWallet(
              from,
              walletBrandDeposit,
              valueToPay,
              req?.user?.id,
              rta.data,
            ),
          );
          const rtaProm = await Promise.all(promisesTx);
          Logger.debug(
            JSON.stringify(rtaProm, null, 2),
            'Update amount custodial',
          );
        } else {
          const vaultBrandWithdraw = await this.getVaultBrand(
            fireblocksCrm._id,
            walletBase,
            to.brand.toString(),
            WalletTypesAccountEnum.VAULT_W,
          );
          const dtoWallet = new WalletCreateDto();
          dtoWallet.name = walletBase.name;
          dtoWallet.type = TypesAccountEnum.WALLET;
          dtoWallet.accountType = WalletTypesAccountEnum.VAULT_W;
          dtoWallet.accountName = walletBase.accountName;
          dtoWallet.nativeAccountName = walletBase.nativeAccountName;
          dtoWallet.accountId = walletBase.accountId;
          dtoWallet.crm = fireblocksCrm;
          dtoWallet.owner = user.id ?? user._id;
          const walletBrandWithdraw = await this.getWalletBrand(
            dtoWallet,
            fireblocksCrm._id,
            vaultBrandWithdraw,
            String(to.brand),
            WalletTypesAccountEnum.VAULT_W,
          );
          if (
            walletBrandWithdraw.amountCustodial + from.amountCustodial <
            createDto.amount
          ) {
            throw new BadRequestException('Insufficient funds');
          }
          rta = await cryptoType.createTransaction(
            from.accountId,
            String(from.amountCustodial),
            vaultFrom.accountId,
            vaultBrandWithdraw.accountId,
          );
          Logger.debug(JSON.stringify(rta.data, null, 2), 'rta from -> brand');
          const promisesTx = [];
          promisesTx.push(
            this.walletService.customUpdateOne({
              id: from._id,
              $inc: {
                amountCustodial: from.amountCustodial * -1,
              },
            }),
            this.walletService.customUpdateOne({
              id: walletBrandWithdraw._id,
              $inc: {
                amountCustodial: from.amountCustodial,
              },
            }),
          );
          if (to?._id) {
            const vaultTo = await this.getVaultUser(
              String(to.owner),
              fireblocksCrm._id,
              walletBase,
              String(to.brand),
            );
            rta = await cryptoType.createTransaction(
              from.accountId,
              String(createDto.amount),
              vaultBrandWithdraw.accountId,
              vaultTo.accountId,
            );
            promisesTx.push(
              this.walletService.customUpdateOne({
                id: walletBrandWithdraw._id,
                $inc: {
                  amountCustodial: createDto.amount * -1,
                },
              }),
            );
            Logger.debug(JSON.stringify(rta.data, null, 2), 'rta brand -> to');
          } else {
            rta = await cryptoType.createTransaction(
              from.accountId,
              String(createDto.amount),
              vaultBrandWithdraw.accountId,
              createDto.to.toString(),
              'Withdrawal',
              true,
            );
            promisesTx.push(
              this.walletService.customUpdateOne({
                id: walletBrandWithdraw._id,
                $inc: {
                  amountCustodial: createDto.amount * -1,
                },
              }),
            );
            Logger.debug(JSON.stringify(rta.data, null, 2), 'rta brand -> to?');
          }
          promisesTx.push(
            this.payByServicesFromWallet(
              from,
              walletBrandDeposit,
              valueToPay,
              req?.user?.id,
              rta.data,
            ),
          );
          const rtaProm = await Promise.all(promisesTx);
          Logger.debug(
            JSON.stringify(rtaProm, null, 2),
            'Update amount custodial to? -> brand',
          );
        }
      } catch (error) {
        Logger.error(error.message, 'Error creating transaction on Fireblocks');
        throw new BadRequestException('Sorry, something went wrong');
      }
      if (!rta) {
        Logger.error(JSON.stringify(rta, null, 2), 'Error rta on Fireblocks');
        throw new BadRequestException('Sorry, something went wrong');
      }
      if (to?._id) {
        this.ewalletBuilder.emitTransferEventClient(
          EventsNamesTransferEnum.createOne,
          {
            name: `Deposit wallet ${to.name}`,
            description: `Deposit from ${from.name} to ${to.name}`,
            currency: to.currency,
            idPayment: rta.data?.id,
            responsepayment: rta.data,
            amount: createDto.amount,
            currencyCustodial: to.currencyCustodial,
            amountCustodial: createDto.amount,
            account: to._id,
            userCreator: req?.user?.id,
            userAccount: to.owner,
            typeTransaction: depositWalletCategory._id,
            psp: internalPspAccount.psp,
            pspAccount: internalPspAccount._id,
            operationType: OperationTransactionType.deposit,
            page: req.get('Host'),
            statusPayment: StatusCashierEnum.APPROVED,
            isApprove: true,
            status: approvedStatus._id,
            brand: to.brand,
            crm: to.crm,
            confirmedAt: new Date(),
            approvedAt: new Date(),
          } as unknown as TransferCreateDto,
        );
      }
      this.ewalletBuilder.emitTransferEventClient(
        EventsNamesTransferEnum.createOne,
        {
          name: `Withdrawal wallet ${from.name}`,
          description: `Withdrawal from ${from.name} to ${
            to?.name ?? createDto.to
          }`,
          currency: from.currency,
          idPayment: rta.data?.id,
          responsepayment: rta.data,
          amount: createDto.amount,
          currencyCustodial: from.currencyCustodial,
          amountCustodial: createDto.amount,
          account: from._id,
          userCreator: req?.user?.id,
          userAccount: from.owner,
          typeTransaction: withdrawalWalletCategory._id,
          psp: internalPspAccount.psp,
          pspAccount: internalPspAccount._id,
          operationType: OperationTransactionType.withdrawal,
          page: req.get('Host'),
          statusPayment: StatusCashierEnum.PENDING,
          status: pendingStatus._id,
          brand: from.brand,
          crm: from.crm,
        } as unknown as TransferCreateDto,
      );
      from.amount = from.amount - createDto.amount;
      return from;
    } else {
      if (to.crm) {
        const address = to.accountName;
        return {
          statusCode: 200,
          data: {
            url: `https://tronscan.org/#/address/${address}`,
            address,
            chain: to.nativeAccountName,
          },
        };
      }
      const transferBtn: TransferCreateButtonDto = {
        amount: createDto.amount.toString(),
        currency: 'USDT',
        account: to._id,
        creator: req?.user.id,
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
        const host = req.get('Host');
        //const url = `${req.protocol}://${host}/transfers/deposit/page/${transfer?._id}`;
        const url = `https://${host}/transfers/deposit/page/${depositAddress?._id}`;
        const data = depositAddress?.responseAccount?.data;
        return {
          statusCode: 200,
          data: {
            txId: depositAddress?._id,
            url: `https://tronscan.org/#/address/${data?.attributes?.address}`,
            address: data?.attributes?.address ?? to.accountName,
            chain: 'TRON BLOCKCHAIN',
          },
        };
      } catch (error) {
        throw new BadRequestException(error);
      }
    }
  }

  private async payByServicesFromWallet(
    walletFrom: AccountEntity,
    walletTo: AccountEntity,
    amount: number,
    creatorId: string,
    paymentResponse: any,
  ) {
    const paymentWalletCategory =
      await this.ewalletBuilder.getPromiseCategoryEventClient(
        EventsNamesCategoryEnum.findOneByNameType,
        {
          slug: 'payment-wallet',
          type: TagEnum.MONETARY_TRANSACTION_TYPE,
        },
      );
    const purchaseWalletCategory =
      await this.ewalletBuilder.getPromiseCategoryEventClient(
        EventsNamesCategoryEnum.findOneByNameType,
        {
          slug: 'purchase-wallet',
          type: TagEnum.MONETARY_TRANSACTION_TYPE,
        },
      );
    const approvedStatus =
      await this.ewalletBuilder.getPromiseStatusEventClient(
        EventsNamesStatusEnum.findOneByName,
        'approved',
      );
    const pendingStatus = await this.ewalletBuilder.getPromiseStatusEventClient(
      EventsNamesStatusEnum.findOneByName,
      'pending',
    );
    const internalPspAccount =
      await this.ewalletBuilder.getPromisePspAccountEventClient(
        EventsNamesPspAccountEnum.findOneByName,
        'internal',
      );
    this.ewalletBuilder.emitTransferEventClient(
      EventsNamesTransferEnum.createOne,
      {
        name: `Payment transfer ${walletTo.name}`,
        description: `Payment from ${walletFrom.name} to ${walletTo.name}`,
        currency: walletTo.currency,
        idPayment: paymentResponse?.id,
        responsepayment: paymentResponse,
        amount: amount,
        currencyCustodial: walletTo.currencyCustodial,
        amountCustodial: amount,
        account: walletTo._id,
        userCreator: creatorId,
        userAccount: walletTo.owner,
        typeTransaction: paymentWalletCategory._id,
        psp: internalPspAccount.psp,
        pspAccount: internalPspAccount._id,
        operationType: OperationTransactionType.payment,
        page: 'Fee Transfer to wallet',
        statusPayment: StatusCashierEnum.APPROVED,
        isApprove: true,
        status: approvedStatus._id,
        brand: walletTo.brand,
        crm: walletTo.crm,
        confirmedAt: new Date(),
        approvedAt: new Date(),
      } as unknown as TransferCreateDto,
    );
    this.ewalletBuilder.emitTransferEventClient(
      EventsNamesTransferEnum.createOne,
      {
        name: `Purchase transfer ${walletFrom.name}`,
        description: `Purchase from ${walletFrom.name} to ${walletTo?.name}`,
        currency: walletFrom.currency,
        idPayment: paymentResponse?.id,
        responsepayment: paymentResponse,
        amount: amount,
        currencyCustodial: walletFrom.currencyCustodial,
        amountCustodial: amount,
        account: walletFrom._id,
        userCreator: creatorId,
        userAccount: walletFrom.owner,
        typeTransaction: purchaseWalletCategory._id,
        psp: internalPspAccount.psp,
        pspAccount: internalPspAccount._id,
        operationType: OperationTransactionType.purchase,
        page: 'Fee Transfer to wallet',
        statusPayment: StatusCashierEnum.PENDING,
        status: pendingStatus._id,
        brand: walletFrom.brand,
        crm: walletFrom.crm,
      } as unknown as TransferCreateDto,
    );
    return true;
  }

  @Patch('withdraw')
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_WALLET)
  @ApiSecurity('b2crypto-key')
  @ApiBearerAuth('bearerToken')
  @UseGuards(ApiKeyAuthGuard)
  async withdraw(@Body() createDto: WalletDepositCreateDto, @Req() req?: any) {
    if (!createDto.from) {
      throw new BadRequestException('from is required');
    }
    if (!createDto.to) {
      throw new BadRequestException('to is required');
    }
    if (!isMongoId(createDto.from.toString())) {
      throw new BadRequestException('from is invalid id');
    }
    const from = await this.findOneById(createDto.from.toString());
    if (isMongoId(createDto.to.toString())) {
      const to = await this.findOneById(createDto.to.toString());
      if (!to) {
        throw new BadRequestException('to wallet is not found');
      }
    } else {
      // const cryptoType = await this.getFireblocksType();
      // if (cryptoType.validateAddress(from.accountId, createDto.to.toString())) {
      //   throw new BadRequestException('to wallet is not valid');
      // }
      if (createDto.to.toString() != 'TSbjxJRBNG56AMFD8uweDJ9Gr7MzPscByL') {
        throw new BadRequestException('to wallet is wrong address');
      }
    }
    if (!from || createDto.from.toString() != '670c28fff74c423d633915a5') {
      throw new BadRequestException('from wallet is not found');
    }
    return this.rechargeOne(createDto, req);
  }

  @EventPattern(EventsNamesAccountEnum.sweepOmnibus)
  async sweepOmnibus(@Ctx() ctx: RmqContext, @Payload() data: any) {
    CommonService.ack(ctx);
    // const depositWalletCategory =
    //   await this.ewalletBuilder.getPromiseCategoryEventClient(
    //     EventsNamesCategoryEnum.findOneByNameType,
    //     {
    //       slug: 'deposit-wallet',
    //       type: TagEnum.MONETARY_TRANSACTION_TYPE,
    //     },
    //   );
    // if (!depositWalletCategory) {
    //   throw new BadRequestException(
    //     'Monetary transaction type "deposit wallet" not found',
    //   );
    // }
    // const pendingStatus = await this.ewalletBuilder.getPromiseStatusEventClient(
    //   EventsNamesStatusEnum.findOneByName,
    //   'pending',
    // );
    // const internalPspAccount =
    //   await this.ewalletBuilder.getPromisePspAccountEventClient(
    //     EventsNamesPspAccountEnum.findOneByName,
    //     'internal',
    //   );
    const fireblocksCrm = await this.ewalletBuilder.getPromiseCrmEventClient(
      EventsNamesCrmEnum.findOneByName,
      IntegrationCryptoEnum.FIREBLOCKS,
    );
    let walletList: ResponsePaginator<AccountEntity> = null;
    const cryptoType = await this.getFireblocksType();
    const walletsBase = {};
    const valuts = {};
    const wallets = {};
    const promises = [];
    Logger.log('Start sweep omnibus');
    do {
      walletList = await this.ewalletBuilder.getPromiseAccountEventClient(
        EventsNamesAccountEnum.findAll,
        {
          page: walletList?.nextPage || 1,
          where: {
            owner: {
              $exists: true,
            },
            type: TypesAccountEnum.WALLET,
            accountType: WalletTypesAccountEnum.VAULT,
            amountCustodial: {
              $gt: 0,
            },
          },
        },
      );
      for (const from of walletList.list) {
        if (!walletsBase[from.name]) {
          walletsBase[from.name] = await this.getWalletBase(
            fireblocksCrm._id,
            from.name,
          );
        }
        const vauleToDeposit = from.amountCustodial * 0.8;
        const vauleToWithdraw = from.amountCustodial * 0.2;
        const walletBase = walletsBase[from.name];
        const brandId = from.brand.toString();
        if (!valuts[brandId]) {
          valuts[brandId] = {
            deposit: await this.getVaultBrand(
              fireblocksCrm._id,
              walletBase,
              brandId.toString(),
              WalletTypesAccountEnum.VAULT_D,
            ),
            withdraw: await this.getVaultBrand(
              fireblocksCrm._id,
              walletBase,
              brandId.toString(),
              WalletTypesAccountEnum.VAULT_W,
            ),
          };
        }
        if (!wallets[brandId]) {
          wallets[brandId] = {
            deposit: await this.getWallet(
              walletBase,
              fireblocksCrm._id,
              valuts[brandId].deposit,
              WalletTypesAccountEnum.VAULT_D,
            ),
            withdraw: await this.getWallet(
              walletBase,
              fireblocksCrm._id,
              valuts[brandId].withdraw,
              WalletTypesAccountEnum.VAULT_W,
            ),
          };
        }
        const vaultFrom = await this.getVaultUser(
          from.owner.toString(),
          fireblocksCrm._id,
          walletBase,
          from.brand.toString(),
        );
        promises.push(
          // Deposit
          cryptoType
            .createTransaction(
              from.accountId,
              String(vauleToDeposit),
              vaultFrom.accountId,
              valuts[brandId].deposit.accountId,
            )
            .catch((err) => {
              Logger.error(
                err,
                `Catch sweep error deposit ${vaultFrom.name}_${from.name}`,
              );
              return null;
            })
            .then((rta) => {
              Logger.debug(
                JSON.stringify(rta?.data, null, 2),
                `rta sweep deposit ${vaultFrom.name}_${from.name}`,
              );
              return Promise.all([
                this.walletService.customUpdateOne({
                  id: from._id,
                  $inc: {
                    amountCustodial: vauleToDeposit * -1,
                  },
                }),
                this.walletService.customUpdateOne({
                  id: wallets[brandId].deposit._id,
                  $inc: {
                    amountCustodial: vauleToDeposit,
                  },
                }),
              ]);
            }),
          // Withdraw
          cryptoType
            .createTransaction(
              from.accountId,
              String(vauleToWithdraw),
              vaultFrom.accountId,
              valuts[brandId].withdraw.accountId,
            )
            .catch((err) => {
              Logger.error(
                err,
                `Catch sweep error withdrawal ${vaultFrom.name}_${from.name}`,
              );
              return null;
            })
            .then((rta) => {
              Logger.debug(
                JSON.stringify(rta?.data, null, 2),
                `rta sweep withdrawal ${vaultFrom.name}_${from.name}`,
              );
              return Promise.all([
                this.walletService.customUpdateOne({
                  id: from._id,
                  $inc: {
                    amountCustodial: vauleToWithdraw * -1,
                  },
                }),
                this.walletService.customUpdateOne({
                  id: wallets[brandId].withdraw._id,
                  $inc: {
                    amountCustodial: vauleToWithdraw,
                  },
                }),
              ]);
            }),
        );
      }
    } while (walletList.nextPage != 1);
    await Promise.all(promises);
    Logger.log('Finish sweep omnibus');
  }

  private async getWallet(
    walletBase: AccountEntity,
    fireblocksCrm: CategoryDocument,
    vault: AccountDocument,
    type: WalletTypesAccountEnum = WalletTypesAccountEnum.VAULT,
  ) {
    const dtoWallet = new WalletCreateDto();
    dtoWallet.name = walletBase.name;
    dtoWallet.type = TypesAccountEnum.WALLET;
    dtoWallet.accountType = WalletTypesAccountEnum.VAULT_W;
    dtoWallet.accountName = walletBase.accountName;
    dtoWallet.nativeAccountName = walletBase.nativeAccountName;
    dtoWallet.accountId = walletBase.accountId;
    dtoWallet.crm = fireblocksCrm;
    dtoWallet.owner = vault.owner;
    return this.getWalletBrand(
      dtoWallet,
      fireblocksCrm._id,
      vault,
      String(vault.brand),
      type,
    );
  }

  @ApiExcludeEndpoint()
  @Patch('lock/:walletId')
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_WALLET)
  @ApiSecurity('b2crypto-key')
  @ApiBearerAuth('bearerToken')
  @UseGuards(ApiKeyAuthGuard)
  async blockedOneById(@Param('walletId') id: string) {
    return this.updateStatusAccount(id, StatusAccountEnum.LOCK);
  }

  @ApiExcludeEndpoint()
  @Patch('unlock/:walletId')
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_WALLET)
  @ApiSecurity('b2crypto-key')
  @ApiBearerAuth('bearerToken')
  @UseGuards(ApiKeyAuthGuard)
  async unblockedOneById(@Param('walletId') id: string) {
    return this.updateStatusAccount(id, StatusAccountEnum.UNLOCK);
  }

  @ApiExcludeEndpoint()
  @Patch('cancel/:walletId')
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_WALLET)
  @ApiSecurity('b2crypto-key')
  @ApiBearerAuth('bearerToken')
  @UseGuards(ApiKeyAuthGuard)
  async cancelOneById(@Param('walletId') id: string) {
    return this.updateStatusAccount(id, StatusAccountEnum.CANCEL);
  }

  @ApiExcludeEndpoint()
  @Patch('hidden/:walletId')
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_WALLET)
  @ApiSecurity('b2crypto-key')
  @ApiBearerAuth('bearerToken')
  @UseGuards(ApiKeyAuthGuard)
  async disableOneById(@Param('walletId') id: string) {
    return this.toggleVisibleToOwner(id, false);
  }

  @ApiExcludeEndpoint()
  @Patch('visible/:walletId')
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_WALLET)
  @ApiSecurity('b2crypto-key')
  @ApiBearerAuth('bearerToken')
  @UseGuards(ApiKeyAuthGuard)
  async enableOneById(@Param('walletId') id: string) {
    return this.toggleVisibleToOwner(id, true);
  }

  @ApiExcludeEndpoint()
  @Delete(':walletID')
  deleteOneById(@Param('walletID') id: string, req?: any) {
    //return this.getAccountService().deleteOneById(id);
    throw new UnauthorizedException();
  }

  @EventPattern(EventsNamesAccountEnum.createOneWallet)
  createOneWalletEvent(
    @Payload() createDto: WalletCreateDto,
    @Ctx() ctx: RmqContext,
  ) {
    CommonService.ack(ctx);
    return this.createOne(createDto);
  }
}
