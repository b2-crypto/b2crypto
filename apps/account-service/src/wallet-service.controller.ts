import { WalletDepositCreateDto } from '@account/account/dto/wallet-deposit.create.dto';
import { WalletCreateDto } from '@account/account/dto/wallet.create.dto';
import { AccountEntity } from '@account/account/entities/account.entity';
import { AccountDocument } from '@account/account/entities/mongoose/account.schema';
import StatusAccountEnum from '@account/account/enum/status.account.enum';
import TypesAccountEnum from '@account/account/enum/types.account.enum';
import WalletTypesAccountEnum from '@account/account/enum/wallet.types.account.enum';
import { ApiKeyAuthGuard } from '@auth/auth/guards/api.key.guard';
import { BuildersService } from '@builder/builders';
import { CommonService } from '@common/common';
import { NoCache } from '@common/common/decorators/no-cache.decorator';
import CountryCodeEnum from '@common/common/enums/country.code.b2crypto.enum';
import CurrencyCodeB2cryptoEnum from '@common/common/enums/currency-code-b2crypto.enum';
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
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Ctx,
  EventPattern,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { TransferCreateDto } from '@transfer/transfer/dto/transfer.create.dto';
import { OperationTransactionType } from '@transfer/transfer/enum/operation.transaction.type.enum';
import EventsNamesCategoryEnum from 'apps/category-service/src/enum/events.names.category.enum';
import EventsNamesPspAccountEnum from 'apps/psp-service/src/enum/events.names.psp.acount.enum';
import EventsNamesStatusEnum from 'apps/status-service/src/enum/events.names.status.enum';
import EventsNamesTransferEnum from 'apps/transfer-service/src/enum/events.names.transfer.enum';
import { UserServiceService } from 'apps/user-service/src/user-service.service';
import { isMongoId } from 'class-validator';
import { SwaggerSteakeyConfigEnum } from 'libs/config/enum/swagger.stakey.config.enum';
import { AccountServiceController } from './account-service.controller';
import { AccountServiceService } from './account-service.service';
import EventsNamesAccountEnum from './enum/events.names.account.enum';
import { WalletServiceService } from './wallet-service.service';

@ApiTags('E-WALLET')
@Controller('wallets')
export class WalletServiceController extends AccountServiceController {
  private cryptoType = null;
  constructor(
    readonly accountServiceService: AccountServiceService,
    @Inject(UserServiceService)
    private readonly userService: UserServiceService,
    @Inject(BuildersService)
    readonly ewalletBuilder: BuildersService,
    private readonly integration: IntegrationService,
    @Inject(WalletServiceService)
    private readonly walletServiceService: WalletServiceService,
    private readonly configService: ConfigService,
    private readonly walletService: WalletServiceService,
  ) {
    super(accountServiceService, ewalletBuilder);
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
    return this.accountServiceService.findAll(query);
  }

  @ApiTags(SwaggerSteakeyConfigEnum.TAG_WALLET)
  @ApiBearerAuth('bearerToken')
  @ApiSecurity('b2crypto-key')
  @Get('me')
  @NoCache()
  findAllMe(@Query() query: QuerySearchAnyDto, @Req() req?: any) {
    query = query ?? {};
    query.where = query.where ?? {};
    query.where.type = TypesAccountEnum.WALLET;
    query = CommonService.getQueryWithUserId(query, req, 'owner');
    return this.accountServiceService.findAll(query);
  }

  @ApiTags(SwaggerSteakeyConfigEnum.TAG_WALLET)
@ApiBearerAuth('bearerToken')
@ApiSecurity('b2crypto-key')
@Post('create')
async createOne(@Body() createDto: WalletCreateDto, @Req() req?: any) {
  createDto.brand = req.user.brand;
  return this.walletServiceService.createWallet(createDto, req?.user?.id);
}

@ApiTags(SwaggerSteakeyConfigEnum.TAG_WALLET)
@ApiBearerAuth('bearerToken')
@ApiSecurity('b2crypto-key')
@Post('create-wallet')
async createWallet(@Body() createDto: WalletCreateDto, @Req() req?: any) {
  createDto.brand = req.user.brand;
  return this.walletServiceService.createWallet(createDto, req?.user?.id);
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
    throw new UnauthorizedException();
    return this.getAccountService().deleteOneById(id);
  }

  @MessagePattern(EventsNamesAccountEnum.migrateOneWallet)
  async migrateWallet(@Ctx() ctx: RmqContext, @Payload() walletToMigrate: any) {
    try {
      CommonService.ack(ctx);
      Logger.log(
        `Migrating wallet ${walletToMigrate.accountId}`,
        WalletServiceController.name,
      );
      const walletList = await this.accountServiceService.findAll({
        where: {
          accountId: walletToMigrate.accountId,
          type: TypesAccountEnum.WALLET,
        },
      });
      if (!walletList || !walletList.list[0]) {
        return await this.accountServiceService.createOne(walletToMigrate);
      } else {
        this.ewalletBuilder.emitAccountEventClient(
          EventsNamesAccountEnum.updateOne,
          {
            id: walletList.list[0]._id,
            owner: walletToMigrate.owner,
          },
        );
        walletList.list[0].owner = walletToMigrate.owner;
        return walletList.list[0];
      }
    } catch (error) {
      Logger.error(error, WalletServiceController.name);
    }
  }

  @EventPattern(EventsNamesAccountEnum.createOneWallet)
  createOneWalletEvent(
    @Payload() createDto: WalletCreateDto,
    @Ctx() ctx: RmqContext,
  ) {
    CommonService.ack(ctx);
    return this.createOne(createDto);
  }
  private async getWalletBase(fireblocksCrmId: string, nameWallet: string) {
    const walletBase = (
      await this.accountServiceService.availableWalletsFireblocks({
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
  private async getVaultUser(
    userId: string,
    fireblocksCrmId: string,
    walletBase: AccountDocument,
    brandId: string,
  ) {
    const vaultUserList = await this.accountServiceService.findAll({
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
      vaultUser = await this.accountServiceService.createOne({
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
        afgId: '', // TODO[hender - 2024/08/12] Check the AFG
      });
    }

    return vaultUser;
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
  private async getWalletBrand(
    dtoWallet: WalletCreateDto,
    fireblocksCrmId: string,
    vaultBrand: AccountDocument,
    brandId: string,
    accountType = WalletTypesAccountEnum.VAULT,
  ) {
    const walletName = `${dtoWallet.name}-${brandId}-${accountType}`;
    let walletUser = (
      await this.accountServiceService.findAll({
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
        CommonService.getNumberDigits(CommonService.randomIntNumber(9999), 4);
      dtoWallet.accountType = WalletTypesAccountEnum.VAULT;

      walletUser = await this.accountServiceService.createOne(dtoWallet);
    }

    return walletUser;
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

  private async getVaultBrand(
    fireblocksCrmId: string,
    walletBase: AccountDocument,
    brandId: string,
    accountType = WalletTypesAccountEnum.VAULT,
  ) {
    const vaultName = `${brandId}-vault-${accountType}`;
    let vaultBrand = (
      await this.accountServiceService.findAll({
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
      vaultBrand = await this.accountServiceService.createOne({
        name: vaultName,
        slug: `${brandId}-vault`,
        owner: undefined,
        accountType,
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
        afgId: '', // TODO[hender - 2024/08/12] Check the AFG
      });
    }

    return vaultBrand;
  }

  @Get('availables')
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_WALLET)
  @ApiSecurity('b2crypto-key')
  @UseGuards(ApiKeyAuthGuard)
  @NoCache()
  availablesWallet(@Query() query: QuerySearchAnyDto, @Req() req?: any) {
    query = query ?? {};
    query.where = query.where ?? {};
    query.where.type = TypesAccountEnum.WALLET;
    query.where.brand = req.user.brand;
    return this.accountServiceService.availableWalletsFireblocks(query);
  }

  @Get('networks')
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_WALLET)
  @ApiSecurity('b2crypto-key')
  @UseGuards(ApiKeyAuthGuard)
  @NoCache()
  networksWallet(@Query() query: QuerySearchAnyDto, @Req() req?: any) {
    query = query ?? {};
    query.where = query.where ?? {};
    query.where.type = TypesAccountEnum.WALLET;
    query.where.brand = req.user.brand;
    return this.accountServiceService.networksWalletsFireblocks(query);
  }
  @Patch('withdraw')
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_WALLET)
  @ApiSecurity('b2crypto-key')
  @ApiBearerAuth('bearerToken')
  @UseGuards(ApiKeyAuthGuard)
  async withdraw(@Body() createDto: WalletDepositCreateDto, @Req() req?: any) {
    const userId = CommonService.getUserId(req);
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
    if (!from || from.owner.toString() != userId) {
      throw new BadRequestException('from wallet is not found');
    }
    if (isMongoId(createDto.to.toString())) {
      const to = await this.findOneById(createDto.to.toString());
      if (!to) {
        throw new BadRequestException('to wallet is not found');
      }
    }
    return this.walletServiceService.rechargeWallet(createDto, userId, req.get('Host'));
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
    return this.walletServiceService.rechargeWallet(
      createDto, 
      req?.user?.id,
      req.get('Host')
    );
  }
}
