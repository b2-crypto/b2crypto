import { WalletDepositCreateDto } from '@account/account/dto/wallet-deposit.create.dto';
import { WalletCreateDto } from '@account/account/dto/wallet.create.dto';
import StatusAccountEnum from '@account/account/enum/status.account.enum';
import TypesAccountEnum from '@account/account/enum/types.account.enum';
import WalletTypesAccountEnum from '@account/account/enum/wallet.types.account.enum';
import { ApiKeyAuthGuard } from '@auth/auth/guards/api.key.guard';
import { BuildersService } from '@builder/builders';
import { CommonService } from '@common/common';
import { NoCache } from '@common/common/decorators/no-cache.decorator';
import CurrencyCodeB2cryptoEnum from '@common/common/enums/currency-code-b2crypto.enum';
import { QuerySearchAnyDto } from '@common/common/models/query_search-any.dto';
import { IntegrationService } from '@integration/integration';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
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
import {
  ApiBearerAuth,
  ApiExcludeEndpoint,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { UserServiceService } from 'apps/user-service/src/user-service.service';
import { AccountServiceService } from './account-service.service';
import { SwaggerSteakeyConfigEnum } from 'libs/config/enum/swagger.stakey.config.enum';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { Cache } from 'cache-manager';
import { WalletServiceService } from './wallet-service.service';
import { isMongoId } from 'class-validator';
import { JwtAuthGuard } from '@auth/auth/guards/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';
import EventsNamesAccountEnum from './enum/events.names.account.enum';

@ApiTags('E-WALLET')
@Controller('wallets')
export class WalletServiceController {
  constructor(
    @Inject(AccountServiceService)
    private readonly accountService: AccountServiceService,
    @Inject(WalletServiceService)
    private readonly walletServiceService: WalletServiceService,
    @Inject(UserServiceService)
    private readonly userService: UserServiceService,
    @Inject(BuildersService)
    private readonly ewalletBuilder: BuildersService,
    private readonly integration: IntegrationService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @ApiTags(SwaggerSteakeyConfigEnum.TAG_WALLET)
  @ApiBearerAuth('bearerToken')
  @ApiSecurity('b2crypto-key')
  @Get('all')
  @NoCache()
  async findAll(@Query() query: QuerySearchAnyDto, @Req() req?: any) {
    const client = req.clientApi;
    query = query ?? {};
    query.where = query.where ?? {};
    query.where.type = TypesAccountEnum.WALLET;
    query.where.showToOwner = true;
    return this.accountService.findAll(query);
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
    const rta = await this.accountService.findAll({
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

    if (!creating && rta.totalElements === 0) {
      await this.cacheManager.set(cacheNameWalletCreate, true, 6 * 1000);

      const defaultWallet: WalletCreateDto = {
        owner: query.where.owner,
        name: 'USD Tether (Tron)',
        accountType: WalletTypesAccountEnum.VAULT,
        type: TypesAccountEnum.WALLET,
        pin: CommonService.getNumberDigits(
          CommonService.randomIntNumber(9999),
          4,
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
        afgId: '',
      };

      await this.createOne(defaultWallet, req);
    }

    return this.accountService.findAll(query);
  }

  @Get('availables')
  @UseGuards(ApiKeyAuthGuard)
  @NoCache()
  availablesWallet(@Query() query: QuerySearchAnyDto, @Req() req?: any) {
    query = query ?? {};
    query.where = query.where ?? {};
    query.where.type = TypesAccountEnum.WALLET;
    query.where.brand = req.user.brand;
    return this.accountService.availableWalletsFireblocks(query);
  }

  @ApiExcludeEndpoint()
  @Get('clean')
  @UseGuards(ApiKeyAuthGuard, JwtAuthGuard)
  @NoCache()
  cleanWallet(@Query() query: QuerySearchAnyDto, @Req() req?: any) {
    throw new NotImplementedException();
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
        rta = this.walletServiceService.createWalletB2BinPay(
          createDto,
          req?.user?.id,
        );
        break;
      case WalletTypesAccountEnum.VAULT:
        rta = this.walletServiceService.createWalletFireblocks(
          createDto,
          req?.user?.id,
        );
        break;
      default:
        throw new BadRequestException(
          `The accountType ${createDto.accountType} is not valid`,
        );
    }
    return rta;
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
      return await this.walletServiceService.rechargeWallet(
        createDto,
        req?.user?.id,
        host,
      );
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @Patch('withdraw')
  @ApiExcludeEndpoint()
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

    const from = await this.accountService.findOneById(
      createDto.from.toString(),
    );
    if (!from || from.owner.toString() != userId) {
      throw new BadRequestException('from wallet is not found');
    }

    if (isMongoId(createDto.to.toString())) {
      const to = await this.accountService.findOneById(createDto.to.toString());
      if (!to) {
        throw new BadRequestException('to wallet is not found');
      }
    }

    return this.rechargeOne(createDto, req);
  }

  @Patch('lock/:walletId')
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_WALLET)
  @ApiSecurity('b2crypto-key')
  @ApiBearerAuth('bearerToken')
  @UseGuards(ApiKeyAuthGuard)
  async blockedOneById(@Param('walletId') id: string) {
    return this.walletServiceService.updateStatusAccount(
      id,
      StatusAccountEnum.LOCK,
    );
  }

  @Patch('unlock/:walletId')
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_WALLET)
  @ApiSecurity('b2crypto-key')
  @ApiBearerAuth('bearerToken')
  @UseGuards(ApiKeyAuthGuard)
  async unblockedOneById(@Param('walletId') id: string) {
    return this.walletServiceService.updateStatusAccount(
      id,
      StatusAccountEnum.UNLOCK,
    );
  }

  @Patch('cancel/:walletId')
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_WALLET)
  @ApiSecurity('b2crypto-key')
  @ApiBearerAuth('bearerToken')
  @UseGuards(ApiKeyAuthGuard)
  async cancelOneById(@Param('walletId') id: string) {
    return this.walletServiceService.updateStatusAccount(
      id,
      StatusAccountEnum.CANCEL,
    );
  }

  @Patch('hidden/:walletId')
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_WALLET)
  @ApiSecurity('b2crypto-key')
  @ApiBearerAuth('bearerToken')
  @UseGuards(ApiKeyAuthGuard)
  async disableOneById(@Param('walletId') id: string) {
    return this.walletServiceService.toggleVisibleToOwner(id, false);
  }

  @Patch('visible/:walletId')
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_WALLET)
  @ApiSecurity('b2crypto-key')
  @ApiBearerAuth('bearerToken')
  @UseGuards(ApiKeyAuthGuard)
  async enableOneById(@Param('walletId') id: string) {
    return this.walletServiceService.toggleVisibleToOwner(id, true);
  }

  @Delete(':walletID')
  async deleteOneById(@Param('walletID') id: string, @Req() req?: any) {
    throw new UnauthorizedException();
  }

  @EventPattern(EventsNamesAccountEnum.migrateOneWallet)
  async migrateWallet(@Ctx() ctx: RmqContext, @Payload() walletToMigrate: any) {
    try {
      CommonService.ack(ctx);
      Logger.log(
        `Migrating wallet ${walletToMigrate.accountId}`,
        WalletServiceController.name,
      );
      const walletList = await this.accountService.findAll({
        where: {
          accountId: walletToMigrate.accountId,
          type: TypesAccountEnum.WALLET,
        },
      });

      if (!walletList || !walletList.list[0]) {
        return await this.accountService.createOne(walletToMigrate);
      } else {
        await this.ewalletBuilder.emitAccountEventClient(
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

  @EventPattern(EventsNamesAccountEnum.sweepOmnibus)
  async sweepOmnibus(@Ctx() ctx: RmqContext, @Payload() data: any) {
    CommonService.ack(ctx);
    Logger.log('Start sweep omnibus');
    await this.walletServiceService.sweepOmnibus(data);
    Logger.log('Finish sweep omnibus');
  }

  @EventPattern(EventsNamesAccountEnum.createOneWallet)
  async createOneWalletEvent(
    @Payload() createDto: WalletCreateDto,
    @Ctx() ctx: RmqContext,
  ) {
    CommonService.ack(ctx);
    return this.createOne(createDto);
  }
}
