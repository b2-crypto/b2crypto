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
import { User } from '@user/user/entities/mongoose/user.schema';
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

@ApiTags('E-WALLET')
@Controller('wallets')
export class WalletServiceController extends AccountServiceController {
  constructor(

    readonly walletService: AccountServiceService,
    @Inject(UserServiceService)
    private readonly userService: UserServiceService,
    @Inject(BuildersService)
    readonly ewalletBuilder: BuildersService,
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
    return this.walletService.findAll(query);
  }

  @ApiTags(SwaggerSteakeyConfigEnum.TAG_WALLET)
  @ApiBearerAuth('bearerToken')
  @ApiSecurity('b2crypto-key')
  @Post('create')
  async createOne(@Body() createDto: WalletCreateDto, @Req() req?: any) {
    const userId = req?.user.id ?? createDto.owner;
    if (!userId) {
      throw new BadRequestException('Need the user id to continue');
    }

    const user: User = (await this.userService.getAll({
      relations: ['personalData'],
      where: { _id: userId },
    })).list[0];

    if (!user.personalData) {
      throw new BadRequestException('Need the personal data to continue');
    }

    createDto.type = TypesAccountEnum.WALLET;
    createDto.accountId = '2177';
    createDto.accountName = 'CoxSQtiWAHVo';
    createDto.accountPassword = 'w7XDOfgfudBvRG';
    createDto.owner = user.id ?? user._id;
    createDto.pin = createDto.pin ?? parseInt(CommonService.getNumberDigits(CommonService.randomIntNumber(9999), 4));

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
      emailData
    )

    if (process.env.ENVIRONMENT === EnvironmentEnum.prod) {
      this.ewalletBuilder.emitAccountEventClient(
        EventsNamesAccountEnum.updateOne,
        {
          id: createdWallet.id ?? createdWallet._id,
          responseCreation: await this.ewalletBuilder.getPromiseTransferEventClient(
            EventsNamesTransferEnum.createOneDepositLink,
            transferBtn
          ),
        }
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
