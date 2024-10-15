import { WalletDepositCreateDto } from '@account/account/dto/wallet-deposit.create.dto';
import { WalletCreateDto } from '@account/account/dto/wallet.create.dto';
import StatusAccountEnum from '@account/account/enum/status.account.enum';
import TypesAccountEnum from '@account/account/enum/types.account.enum';
import { ApiKeyAuthGuard } from '@auth/auth/guards/api.key.guard';
import { BuildersService } from '@builder/builders';
import { CommonService } from '@common/common';
import { NoCache } from '@common/common/decorators/no-cache.decorator';
import { EnvironmentEnum } from '@common/common/enums/environment.enum';
import { StatusCashierEnum } from '@common/common/enums/StatusCashierEnum';
import TagEnum from '@common/common/enums/TagEnum';
import { QuerySearchAnyDto } from '@common/common/models/query_search-any.dto';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { TransferCreateDto } from '@transfer/transfer/dto/transfer.create.dto';
import { OperationTransactionType } from '@transfer/transfer/enum/operation.transaction.type.enum';
import { User } from '@user/user/entities/mongoose/user.schema';
import EventsNamesCategoryEnum from 'apps/category-service/src/enum/events.names.category.enum';
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
import WalletTypesAccountEnum from '@account/account/enum/wallet.types.account.enum';
import EventsNamesCrmEnum from 'apps/crm-service/src/enum/events.names.crm.enum';
import IntegrationCryptoEnum from '@integration/integration/crypto/enums/IntegrationCryptoEnum';
import { IntegrationService } from '@integration/integration';
import { FireblocksIntegrationService } from '@integration/integration/crypto/fireblocks/fireblocks-integration.service';
import CurrencyCodeB2cryptoEnum from '@common/common/enums/currency-code-b2crypto.enum';
import CountryCodeEnum from '@common/common/enums/country.code.b2crypto.enum';
import { AccountDocument } from '@account/account/entities/mongoose/account.schema';
import { JwtAuthGuard } from '@auth/auth/guards/jwt-auth.guard';

@ApiTags('E-WALLET')
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
          statusText: StatusAccountEnum.VISIBLE,
          accountStatus: [],
          createdAt: undefined,
          updatedAt: undefined,
          cardConfig: undefined,
          amount: 0,
          currency: CurrencyCodeB2cryptoEnum.USDT,
          amountCustodial: 0,
          currencyCustodial: CurrencyCodeB2cryptoEnum.USD,
          amountBlocked: 0,
          currencyBlocked: CurrencyCodeB2cryptoEnum.USD,
          amountBlockedCustodial: 0,
          currencyBlockedCustodial: CurrencyCodeB2cryptoEnum.USD,
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
    return this.walletService.availableWalletsFireblocks(query);
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
        currency: 'USD',
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
    let vaultUser = (
      await this.walletService.findAll({
        where: {
          accountType: WalletTypesAccountEnum.VAULT,
          crm: fireblocksCrmId,
          showToOwner: false,
          owner: userId,
        },
      })
    ).list[0];
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
        currency: CurrencyCodeB2cryptoEnum.USD,
        amountCustodial: 0,
        currencyCustodial: CurrencyCodeB2cryptoEnum.USD,
        amountBlocked: 0,
        currencyBlocked: CurrencyCodeB2cryptoEnum.USD,
        amountBlockedCustodial: 0,
        currencyBlockedCustodial: CurrencyCodeB2cryptoEnum.USD,
      });
    }

    return vaultUser;
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
      throw new BadRequestException('The recharge not be 10 or less');
    }
    const to = await this.getAccountService().findOneById(
      createDto.to.toString(),
    );
    if (to.type != TypesAccountEnum.WALLET) {
      throw new BadRequestException('Wallet not found');
    }
    if (createDto.from) {
      const from = await this.getAccountService().findOneById(
        createDto.from.toString(),
      );
      if (from.type != TypesAccountEnum.WALLET) {
        throw new BadRequestException('Wallet not found');
      }
      const depositWalletCategory =
        await this.ewalletBuilder.getPromiseCategoryEventClient(
          EventsNamesCategoryEnum.findOneByNameType,
          {
            slug: 'deposit-wallet',
            type: TagEnum.MONETARY_TRANSACTION_TYPE,
          },
        );
      const withDrawalWalletCategory =
        await this.ewalletBuilder.getPromiseCategoryEventClient(
          EventsNamesCategoryEnum.findOneByNameType,
          {
            slug: 'withdrawal-wallet',
            type: TagEnum.MONETARY_TRANSACTION_TYPE,
          },
        );
      const approvedStatus =
        await this.ewalletBuilder.getPromiseStatusEventClient(
          EventsNamesStatusEnum.findOneByName,
          'approved',
        );
      const internalPspAccount =
        await this.ewalletBuilder.getPromisePspAccountEventClient(
          EventsNamesPspAccountEnum.findOneByName,
          'internal',
        );
      const result = Promise.all([
        this.walletService.customUpdateOne({
          id: createDto.to,
          $inc: {
            amount: createDto.amount,
          },
        }),
        this.walletService.customUpdateOne({
          id: createDto.from.toString(),
          $inc: {
            amount: createDto.amount * -1,
          },
        }),
      ]).then((list) => list[0]);
      this.ewalletBuilder.emitTransferEventClient(
        EventsNamesTransferEnum.createOne,
        {
          name: `Recharge wallet ${to.name}`,
          description: `Recharge from wallet ${from.name} to card ${to.name}`,
          currency: to.currency,
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
          approve: true,
          status: approvedStatus._id,
          brand: to.brand,
          crm: to.crm,
          confirmedAt: new Date(),
          approvedAt: new Date(),
        } as unknown as TransferCreateDto,
      );
      this.ewalletBuilder.emitTransferEventClient(
        EventsNamesTransferEnum.createOne,
        {
          name: `Withdrawal wallet ${from.name}`,
          description: `Recharge from wallet ${from.name} to card ${to.name}`,
          currency: from.currency,
          amount: createDto.amount,
          currencyCustodial: from.currencyCustodial,
          amountCustodial: createDto.amount,
          account: from._id,
          userCreator: req?.user?.id,
          userAccount: from.owner,
          typeTransaction: withDrawalWalletCategory._id,
          psp: internalPspAccount.psp,
          pspAccount: internalPspAccount._id,
          operationType: OperationTransactionType.withdrawal,
          page: req.get('Host'),
          statusPayment: StatusCashierEnum.APPROVED,
          approve: true,
          status: approvedStatus._id,
          brand: from.brand,
          crm: from.crm,
          confirmedAt: new Date(),
          approvedAt: new Date(),
        } as unknown as TransferCreateDto,
      );
      return result;
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
        currency: 'USD',
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

  @Patch('lock/:walletId')
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_WALLET)
  @ApiSecurity('b2crypto-key')
  @ApiBearerAuth('bearerToken')
  @UseGuards(ApiKeyAuthGuard)
  async blockedOneById(@Param('walletId') id: string) {
    return this.updateStatusAccount(id, StatusAccountEnum.LOCK);
  }

  @Patch('unlock/:walletId')
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_WALLET)
  @ApiSecurity('b2crypto-key')
  @ApiBearerAuth('bearerToken')
  @UseGuards(ApiKeyAuthGuard)
  async unblockedOneById(@Param('walletId') id: string) {
    return this.updateStatusAccount(id, StatusAccountEnum.UNLOCK);
  }

  @Patch('cancel/:walletId')
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_WALLET)
  @ApiSecurity('b2crypto-key')
  @ApiBearerAuth('bearerToken')
  @UseGuards(ApiKeyAuthGuard)
  async cancelOneById(@Param('walletId') id: string) {
    return this.updateStatusAccount(id, StatusAccountEnum.CANCEL);
  }

  @Patch('hidden/:walletId')
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_WALLET)
  @ApiSecurity('b2crypto-key')
  @ApiBearerAuth('bearerToken')
  @UseGuards(ApiKeyAuthGuard)
  async disableOneById(@Param('walletId') id: string) {
    return this.toggleVisibleToOwner(id, false);
  }

  @Patch('visible/:walletId')
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_WALLET)
  @ApiSecurity('b2crypto-key')
  @ApiBearerAuth('bearerToken')
  @UseGuards(ApiKeyAuthGuard)
  async enableOneById(@Param('walletId') id: string) {
    return this.toggleVisibleToOwner(id, true);
  }

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
