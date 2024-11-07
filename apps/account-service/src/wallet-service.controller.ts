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
import { SwaggerSteakeyConfigEnum } from 'libs/config/enum/swagger.stakey.config.enum';
import {
  Ctx,
  EventPattern,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import EventsNamesAccountEnum from './enum/events.names.account.enum';
import EventsNamesTransferEnum from 'apps/transfer-service/src/enum/events.names.transfer.enum';
import { TransferCreateButtonDto } from 'apps/transfer-service/src/dto/transfer.create.button.dto';
import EventsNamesMessageEnum from 'apps/message-service/src/enum/events.names.message.enum';
import TransportEnum from '@common/common/enums/TransportEnum';
import { NoCache } from '@common/common/decorators/no-cache.decorator';
import { EnvironmentEnum } from '@common/common/enums/environment.enum';
import EventsNamesStatusEnum from 'apps/status-service/src/enum/events.names.status.enum';
import TagEnum from '@common/common/enums/TagEnum';
import EventsNamesCategoryEnum from 'apps/category-service/src/enum/events.names.category.enum';
import EventsNamesPspAccountEnum from 'apps/psp-service/src/enum/events.names.psp.acount.enum';
import { OperationTransactionType } from '@transfer/transfer/enum/operation.transaction.type.enum';
import { StatusCashierEnum } from '@common/common/enums/StatusCashierEnum';
import { TransferCreateDto } from '@transfer/transfer/dto/transfer.create.dto';
import { WalletServiceService } from './wallet-service.service';

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
    @Inject(WalletServiceService)
    private readonly walletServiceService: WalletServiceService,
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

  @ApiTags(SwaggerSteakeyConfigEnum.TAG_WALLET)
  @ApiBearerAuth('bearerToken')
  @ApiSecurity('b2crypto-key')
  @Get('me')
  @NoCache()
  findAllMe(@Query() query: QuerySearchAnyDto, @Req() req?: any) {
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

  @ApiExcludeEndpoint()
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
    return this.walletServiceService.createWallet(createDto, req?.user?.id);
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
    try {
      const host = req.get('Host');
      return await this.walletServiceService.rechargeWallet(createDto, req?.user?.id, host);
    } catch (error) {
      throw new BadRequestException(error.message);
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
  @ApiExcludeEndpoint()
  //@ApiTags(SwaggerSteakeyConfigEnum.TAG_WALLET)
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
    } else {
      // const cryptoType = await this.getFireblocksType();
      // if (cryptoType.validateAddress(from.accountId, createDto.to.toString())) {
      //   throw new BadRequestException('to wallet is not valid');
      // }
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
      const walletList = await this.walletService.findAll({
        where: {
          accountId: walletToMigrate.accountId,
          type: TypesAccountEnum.WALLET,
        },
      });
      if (!walletList || !walletList.list[0]) {
        return await this.walletService.createOne(walletToMigrate);
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
}
