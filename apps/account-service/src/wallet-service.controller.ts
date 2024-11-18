import { WalletDepositCreateDto } from '@account/account/dto/wallet-deposit.create.dto';
import { WalletCreateDto } from '@account/account/dto/wallet.create.dto';
import StatusAccountEnum from '@account/account/enum/status.account.enum';
import TypesAccountEnum from '@account/account/enum/types.account.enum';
import { ApiKeyAuthGuard } from '@auth/auth/guards/api.key.guard';
import { BuildersService } from '@builder/builders';
import { CommonService } from '@common/common';
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
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { UserServiceService } from 'apps/user-service/src/user-service.service';
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
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import WalletTypesAccountEnum from '@account/account/enum/wallet.types.account.enum';
import CurrencyCodeB2cryptoEnum from '@common/common/enums/currency-code-b2crypto.enum';
import { IntegrationService } from '@integration/integration';
import { NoCache } from '@common/common/decorators/no-cache.decorator';

@ApiTags('E-WALLET')
@Controller('wallets')
export class WalletServiceController extends AccountServiceController {
  constructor(
    readonly walletService: AccountServiceService,
    @Inject(UserServiceService)
    private readonly userService: UserServiceService,
    @Inject(BuildersService)
    readonly ewalletBuilder: BuildersService,
    private readonly integration: IntegrationService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    super(walletService, ewalletBuilder);
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
    query = CommonService.getQueryWithUserId(query, req, 'owner');
    const rta = await this.walletService.findAll({
      take: 1,
      where: {
        owner: userId,
        type: TypesAccountEnum.WALLET,
        accountType: WalletTypesAccountEnum.VAULT,
        showToOwner: true,
      },
    });
    const cacheNameWalletCreate = `create-wallet-${userId}`;
    const creating = await this.cacheManager.get<boolean>(
      cacheNameWalletCreate,
    );
    if (!creating && rta.totalElements == 0) {
      await this.cacheManager.set(cacheNameWalletCreate, true, 6 * 1000);
      await this.createOne(
        {
          owner: query.where.owner,
          name: 'USD Tether (Tron)',
          accountType: WalletTypesAccountEnum.VAULT,
          type: TypesAccountEnum.WALLET,
          pin: CommonService.getNumberDigits(
            CommonService.randomIntNumber(9999),
            4
          ),
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
          afgId: ''
        },
        req,
      );
    }
    return this.walletService.findAll(query);
  }

  @ApiTags(SwaggerSteakeyConfigEnum.TAG_WALLET)
  @ApiBearerAuth('bearerToken')
  @ApiSecurity('b2crypto-key')
  @Post('create')
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