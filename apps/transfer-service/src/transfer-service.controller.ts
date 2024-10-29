import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Logger,
  NotFoundException,
  NotImplementedException,
  Param,
  ParseArrayPipe,
  Patch,
  Post,
  Query,
  Req,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExcludeEndpoint,
  ApiHeader,
  ApiQuery,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';

import { AllowAnon } from '@auth/auth/decorators/allow-anon.decorator';
import { ApiKeyCheck } from '@auth/auth/decorators/api-key-check.decorator';
import { ApiKeyAffiliateAuthGuard } from '@auth/auth/guards/api.key.affiliate.guard';
import { ApiKeyAuthGuard } from '@auth/auth/guards/api.key.guard';
import { BuildersService } from '@builder/builders';
import { CommonService } from '@common/common';
import { NoCache } from '@common/common/decorators/no-cache.decorator';
import ActionsEnum from '@common/common/enums/ActionEnum';
import ResourcesEnum from '@common/common/enums/ResourceEnum';
import TagEnum from '@common/common/enums/TagEnum';
import GenericServiceController from '@common/common/interfaces/controller.generic.interface';
import { ResponsePaginator } from '@common/common/interfaces/response-pagination.interface';
import { CreateAnyDto } from '@common/common/models/create-any.dto';
import { QuerySearchAnyDto } from '@common/common/models/query_search-any.dto';
import { UpdateAnyDto } from '@common/common/models/update-any.dto';
import {
  Ctx,
  EventPattern,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { PspAccountInterface } from '@psp-account/psp-account/entities/psp-account.interface';
import { PspInterface } from '@psp/psp/entities/psp.interface';
import ResponseB2Crypto from '@response-b2crypto/response-b2crypto/models/ResponseB2Crypto';
import { StatsDatePspAccountDocument } from '@stats/stats/entities/mongoose/stats.date.psp.account.schema';
import { TransferCreateDto } from '@transfer/transfer/dto/transfer.create.dto';
import { TransferUpdateDto } from '@transfer/transfer/dto/transfer.update.dto';
import { TransferUpdateFromLatamCashierDto } from '@transfer/transfer/dto/transfer.update.from.latamcashier.dto';
import { TransferUpdateWithdrawalDto } from '@transfer/transfer/dto/transfer.update.withdrawal.dto';
import { TransferDocument } from '@transfer/transfer/entities/mongoose/transfer.schema';
import { TransferEntity } from '@transfer/transfer/entities/transfer.entity';
import { OperationTransactionType } from '@transfer/transfer/enum/operation.transaction.type.enum';
import EventsNamesAccountEnum from 'apps/account-service/src/enum/events.names.account.enum';
import { AffiliateServiceService } from 'apps/affiliate-service/src/affiliate-service.service';
import EventsNamesAffiliateEnum from 'apps/affiliate-service/src/enum/events.names.affiliate.enum';
import EventsNamesCategoryEnum from 'apps/category-service/src/enum/events.names.category.enum';
import EventsNamesCrmEnum from 'apps/crm-service/src/enum/events.names.crm.enum';
import { PomeloProcessEnum } from 'apps/integration-service/src/enums/pomelo.process.enum';
import EventsNamesPspAccountEnum from 'apps/psp-service/src/enum/events.names.psp.acount.enum';
import EventsNamesStatsEnum from 'apps/stats-service/src/enum/events.names.stats.enum';
import EventsNamesStatusEnum from 'apps/status-service/src/enum/events.names.status.enum';
import { isMongoId } from 'class-validator';
import { SwaggerSteakeyConfigEnum } from 'libs/config/enum/swagger.stakey.config.enum';
import { ApproveOrRejectDepositDto } from '../../../libs/transfer/src/dto/approve.or.reject.deposit.dto';
import { BoldTransferRequestDto } from './dto/bold.transfer.request.dto';
import { TransferAffiliateResponseDto } from './dto/transfer.affiliate.response.dto';
import { TransferCreateButtonDto } from './dto/transfer.create.button.dto';
import { BoldStatusEnum } from './enum/bold.status.enum';
import EventsNamesTransferEnum from './enum/events.names.transfer.enum';
import { TransferServiceService } from './transfer-service.service';

@ApiTags('TRANSFERS')
@Controller('transfers')
export class TransferServiceController implements GenericServiceController {
  constructor(
    @Inject(AffiliateServiceService)
    private readonly affliateService: AffiliateServiceService,
    private readonly transferService: TransferServiceService,
    @Inject(BuildersService)
    private readonly builder: BuildersService,
  ) {}

  @ApiExcludeEndpoint()
  @AllowAnon()
  @Post('bold/webhook')
  // @CheckPoliciesAbility(new PolicyHandlerTransferRead())
  async boldWebhook(@Body() transferBold: BoldTransferRequestDto) {
    if (
      !transferBold.link_id ||
      !transferBold.payment_status ||
      !transferBold.reference_id
    ) {
      throw new BadRequestException();
    }
    const txs = await this.transferService.getAll({
      where: {
        _id: transferBold.reference_id,
      },
    });
    const tx = txs.list[0];
    if (
      tx.statusPayment === BoldStatusEnum.APPROVED ||
      tx.statusPayment === BoldStatusEnum.NO_TRANSACTION_FOUND ||
      tx.statusPayment === BoldStatusEnum.REJECTED
    ) {
      Logger.debug(
        JSON.stringify(transferBold),
        'Transaction has finish before',
      );
      throw new BadRequestException('transfer has finish before');
    }
    tx.statusPayment = transferBold.payment_status;
    tx.responsePayment = {
      success: true,
      message: transferBold.description,
      payload: {
        url: transferBold.link_id,
        message: transferBold.payer_email ?? 'N/A',
        type: transferBold.payment_status,
        data: transferBold,
      },
    };
    /* switch (tx.statusPayment) {
      case BoldStatusEnum.APPROVED:
        break;
      case BoldStatusEnum.FAILED:
        break;
      case BoldStatusEnum.REJECTED:
        break;
      case BoldStatusEnum.PENDING:
        break;
      case BoldStatusEnum.PROCESSING:
        break;
      case BoldStatusEnum.NO_TRANSACTION_FOUND:
        break;
    } */
    this.builder.emitTransferEventClient(EventsNamesTransferEnum.updateOne, {
      id: tx._id,
      statusPayment: tx.statusPayment,
      responsePayment: tx.responsePayment,
    });
    return {
      statusCode: 200,
      message: 'Transaction updated',
    };
  }

  @ApiExcludeEndpoint()
  @NoCache()
  @Get('searchText')
  // @CheckPoliciesAbility(new PolicyHandlerTransferRead())
  async searchText(@Query() query: QuerySearchAnyDto, @Req() req?) {
    //query = await this.filterFromUserPermissions(query, req);
    return this.transferService.getSearchText(query);
  }

  @ApiExcludeEndpoint()
  @NoCache()
  @Get('all')
  // @CheckPoliciesAbility(new PolicyHandlerTransferRead())
  async findAll(@Query() query: QuerySearchAnyDto, @Req() req?) {
    //query = await this.filterFromUserPermissions(query, req);
    return this.transferService.getAll(query);
  }

  @ApiExcludeEndpoint()
  @NoCache()
  @Get('me')
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_DEPOSIT)
  @ApiSecurity('b2crypto-key')
  @ApiBearerAuth('bearerToken')
  @UseGuards(ApiKeyAuthGuard)
  // @CheckPoliciesAbility(new PolicyHandlerTransferRead())
  async findAllMe(@Query() query: QuerySearchAnyDto, @Req() req?) {
    //query = await this.filterFromUserPermissions(query, req);
    query = CommonService.getQueryWithUserId(query, req, 'userAccount');
    return this.transferService.getAll(query);
  }

  @ApiExcludeEndpoint()
  @NoCache()
  @Get('check-types-account/:transferID')
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_DEPOSIT)
  @ApiSecurity('b2crypto-key')
  @ApiBearerAuth('bearerToken')
  @UseGuards(ApiKeyAuthGuard)
  // @CheckPoliciesAbility(new PolicyHandlerTransferRead())
  async checkTypesAccount(@Param('transferID') id: string, @Req() req?) {
    if (isMongoId(id)) {
      const txs = await this.transferService.getAll({
        relations: ['account'],
        where: {
          _id: id,
        },
      });
      if (!txs.list[0]) {
        throw new NotFoundException();
      }
      const tx = txs.list[0];
      Logger.debug(
        `${tx.account.type}-${tx.account.accountType}`,
        `Check types account - ${tx.numericId} - Transfer: ${tx._id}`,
      );
      return this.transferService
        .updateTransfer({
          id: tx._id,
          typeAccount: tx.account.type,
          typeAccountType: tx.account.accountType,
        })
        .then(() => `${tx.numericId}-${tx._id}`);
    } else {
      let txs = await this.transferService.getAll({});
      const promises = [];
      do {
        for (const tx of txs.list) {
          promises.push(this.checkTypesAccount(tx._id.toString()));
        }
        txs = await this.transferService.getAll({
          page: txs.nextPage,
        });
      } while (txs.nextPage != 1);

      return Promise.all(promises);
    }
  }

  @ApiExcludeEndpoint()
  @NoCache()
  @Get('deposit')
  // @CheckPoliciesAbility(new PolicyHandlerTransferRead())
  async findDeposit(@Query() query: QuerySearchAnyDto, @Req() req?) {
    query = query ?? new QuerySearchAnyDto();
    query.where = query.where ?? {};
    query.where.operationType = OperationTransactionType.deposit;
    query = await this.filterFromUserPermissions(query, req);
    return this.transferService.getAll(query);
  }

  @ApiExcludeEndpoint()
  @NoCache()
  @Get('credit')
  // @CheckPoliciesAbility(new PolicyHandlerTransferRead())
  async findCredit(@Query() query: QuerySearchAnyDto, @Req() req?) {
    query = query ?? new QuerySearchAnyDto();
    query.where = query.where ?? {};
    query.where.operationType = OperationTransactionType.credit;
    query = await this.filterFromUserPermissions(query, req);
    return this.transferService.getAll(query);
  }

  @ApiExcludeEndpoint()
  @NoCache()
  @Get('withdrawal')
  // @CheckPoliciesAbility(new PolicyHandlerTransferRead())
  async findWithdrawal(@Query() query: QuerySearchAnyDto, @Req() req?) {
    query = query ?? new QuerySearchAnyDto();
    query.where = query.where ?? {};
    query.where.operationType = OperationTransactionType.withdrawal;
    query = await this.filterFromUserPermissions(query, req);
    return this.transferService.getAll(query);
  }

  @ApiExcludeEndpoint()
  @NoCache()
  @Get('debit')
  // @CheckPoliciesAbility(new PolicyHandlerTransferRead())
  async findDebit(@Query() query: QuerySearchAnyDto, @Req() req?) {
    query = query ?? new QuerySearchAnyDto();
    query.where = query.where ?? {};
    query.where.operationType = OperationTransactionType.debit;
    query = await this.filterFromUserPermissions(query, req);
    return this.transferService.getAll(query);
  }

  @ApiExcludeEndpoint()
  @NoCache()
  @Get('chargeback')
  // @CheckPoliciesAbility(new PolicyHandlerTransferRead())
  async findChargeBack(@Query() query: QuerySearchAnyDto, @Req() req?) {
    query = query ?? new QuerySearchAnyDto();
    query.where = query.where ?? {};
    query.where.operationType = OperationTransactionType.chargeback;
    query = await this.filterFromUserPermissions(query, req);
    return this.transferService.getAll(query);
  }

  @ApiExcludeEndpoint()
  @NoCache()
  @Get('check-numeric-id')
  // @CheckPoliciesAbility(new PolicyHandlerTransferRead())
  async checkNumericId() {
    throw new NotFoundException('Not found numeric id');
    //return this.transferService.checkNumericId();
  }

  /* @Get('deposit/:transferID')
  // @CheckPoliciesAbility(new PolicyHandlerTransferRead())
  async findOneDeposit(@Param('transferID') id: string) {
    const deposit = await this.transferService.getOne(id);
    if (deposit && deposit.operationType === OperationTransactionType.deposit) {
      return deposit;
    }
    throw new NotFoundException(`Not found deposit "${id}"`);
  } */

  @ApiExcludeEndpoint()
  @NoCache()
  @Get('credit/:transferID')
  // @CheckPoliciesAbility(new PolicyHandlerTransferRead())
  async findOneCredit(@Param('transferID') id: string) {
    const credit = await this.transferService.getOne(id);
    if (credit && credit.operationType === OperationTransactionType.credit) {
      return credit;
    }
    throw new NotFoundException(`Not found credit "${id}"`);
  }

  @NoCache()
  @Get('withdrawal/:transferID')
  // @CheckPoliciesAbility(new PolicyHandlerTransferRead())
  async findOneWithdrawal(@Param('transferID') id: string) {
    const withdrawal = await this.transferService.getOne(id);
    if (
      withdrawal &&
      withdrawal.operationType === OperationTransactionType.withdrawal
    ) {
      return withdrawal;
    }
    throw new NotFoundException(`Not found withdrawal "${id}"`);
  }

  @ApiExcludeEndpoint()
  @NoCache()
  @Get('debit/:transferID')
  // @CheckPoliciesAbility(new PolicyHandlerTransferRead())
  async findOneDebit(@Param('transferID') id: string) {
    const debit = await this.transferService.getOne(id);
    if (debit && debit.operationType === OperationTransactionType.debit) {
      return debit;
    }
    throw new NotFoundException(`Not found debit "${id}"`);
  }

  @ApiExcludeEndpoint()
  @NoCache()
  @Get('chargeback/:transferID')
  // @CheckPoliciesAbility(new PolicyHandlerTransferRead())
  async findOneChargeback(@Param('transferID') id: string) {
    const chargeback = await this.transferService.getOne(id);
    if (
      chargeback &&
      chargeback.operationType === OperationTransactionType.chargeback
    ) {
      return chargeback;
    }
    throw new NotFoundException(`Not found chargeback "${id}"`);
  }

  // TODO[hender - 30-01-2024] Add to endpoint list

  @ApiExcludeEndpoint()
  @NoCache()
  @Get(':transferID')
  // @CheckPoliciesAbility(new PolicyHandlerTransferRead())
  async findOneById(@Param('transferID') id: string) {
    return this.transferService.getOne(id);
  }

  @ApiExcludeEndpoint()
  @Post()
  // @CheckPoliciesAbility(new PolicyHandlerTransferCreate())
  async createOne(@Body() createTransferDto: TransferCreateDto, @Req() req) {
    createTransferDto.userCreator = req?.user?.id;
    if (createTransferDto.isApprove || createTransferDto.isManualTx) {
      createTransferDto.userApprover = req?.user?.id;
    }
    return this.transferService.newTransfer(createTransferDto);
  }

  @ApiExcludeEndpoint()
  @AllowAnon()
  @Post('bold/status')
  // @CheckPoliciesAbility(new PolicyHandlerTransferRead())
  async boldStatus(@Body() data: any) {
    Logger.debug(data);
  }

  @Post('deposit')
  // @CheckPoliciesAbility(new PolicyHandlerTransferCreate())
  async createOneDeposit(
    @Body() createTransferDto: TransferCreateDto,
    @Req() req,
  ) {
    createTransferDto.userCreator = req?.user?.id;
    if (createTransferDto.isApprove || createTransferDto.isManualTx) {
      createTransferDto.userApprover = req?.user?.id;
    }
    createTransferDto.operationType = OperationTransactionType.deposit;
    return this.transferService.newTransfer(createTransferDto);
  }

  @NoCache()
  @ApiBearerAuth('bearerToken')
  @UseGuards(ApiKeyAuthGuard)
  @ApiHeader({
    name: 'b2crypto-key',
    description: 'The apiKey',
  })
  @ApiQuery({
    name: 'identifier',
  })
  @Get('deposit/link')
  // @CheckPoliciesAbility(new PolicyHandlerTransferCreate())
  async createOneDepositPaymentPage(
    @Query() createTransferButtonDto: TransferCreateButtonDto,
    @Req() req,
    @Res() res: Response,
  ) {
    createTransferButtonDto.creator = req?.user?.id;
    createTransferButtonDto.host = req.get('Host');
    const transfer = await this.createOneDepositPaymentLinkEvent(
      createTransferButtonDto,
    );
    //const url = `${req.protocol}://${createTransferButtonDto.host}/transfers/deposit/page/${transfer?._id}`;
    const url = `https://${createTransferButtonDto.host}/transfers/deposit/page/${transfer?._id}`;
    return res.json({
      statusCode: 200,
      data: {
        id: transfer?._id,
        url,
      },
    });
  }

  @NoCache()
  @AllowAnon()
  @NoCache()
  @Get('deposit/page/:id')
  // @CheckPoliciesAbility(new PolicyHandlerTransferCreate())
  async paymentPageDeposit(
    @Param('id') id: string,
    @Request() req,
    @Res() res: Response,
  ) {
    //createTransferDto.userCreator = req?.user?.id;
    const transfer = await this.transferService.getOne(id);
    if (!transfer?.responseAccount?.data?.attributes?.payment_page) {
      throw new NotFoundException('URL payment not found');
      //throw new InternalServerErrorException('URL not found');
    }
    return res.redirect(
      transfer?.responseAccount?.data?.attributes?.payment_page,
    );
  }

  @ApiExcludeEndpoint()
  @NoCache()
  @Get('send-last-6h-history/:shortData')
  // @CheckPoliciesAbility(new PolicyHandlerTransferCreate())
  async sendLast6hHistory_(
    @Param('shortData') shortData = true,
    @Request() req,
  ) {
    //await this.transferService.sendLast6hHistoryCardPurchases(!!shortData);
    this.builder.emitTransferEventClient(
      EventsNamesTransferEnum.sendLast6hHistory,
      shortData,
    );
    return {
      statusCode: 200,
      message: 'Sended',
    };
  }

  @ApiExcludeEndpoint()
  @NoCache()
  @Get('send-last-6h-history-card-purchases/:shortData')
  // @CheckPoliciesAbility(new PolicyHandlerTransferCreate())
  async sendLast6hHistoryCardPurchases(
    @Param('shortData') shortData = true,
    @Request() req,
  ) {
    //await this.transferService.sendLast6hHistoryCardPurchases(!!shortData);
    this.builder.emitTransferEventClient(
      EventsNamesTransferEnum.sendLast6hHistoryCardPurchases,
      shortData,
    );
    return {
      statusCode: 200,
      message: 'Sended',
    };
  }

  @ApiExcludeEndpoint()
  @NoCache()
  @Get('send-last-6h-history-card-wallet-deposits/:shortData')
  // @CheckPoliciesAbility(new PolicyHandlerTransferCreate())
  async sendLast6hHistoryCardWalletDeposits(
    @Param('shortData') shortData = true,
    @Request() req,
  ) {
    //await this.transferService.sendLast6hHistoryCardPurchases(!!shortData);
    this.builder.emitTransferEventClient(
      EventsNamesTransferEnum.sendLast6hHistoryCardWalletDeposits,
      shortData,
    );
    return {
      statusCode: 200,
      message: 'Sended',
    };
  }

  @ApiExcludeEndpoint()
  @NoCache()
  @Get('check/by-accounts')
  // @CheckPoliciesAbility(new PolicyHandlerTransferCreate())
  async checkAccounts(@Request() req) {
    const query = new QuerySearchAnyDto();
    query.where = query.where ?? {};
    query.where.account = {
      $exists: true,
    };
    query.relations = ['account'];
    query.page = 1;
    query.take = 10;
    const transfersList = await this.transferService.getAll({
      ...query,
    });
    const promises = [];
    const transfersWithBadAccount = [];
    do {
      promises.push(
        this.transferService
          .getAll({
            ...query,
          })
          .then(async (transfers) => {
            Logger.log(
              `page ${transfers.currentPage}/${transfers.lastPage}`,
              'Check by accounts',
            );
            const list = [];
            for (const transfer of transfers.list) {
              if (!transfer.account) {
                const tx = await this.transferService.getOne(transfer._id);
                Logger.log(
                  `${transfer.name}-${transfer.description}`,
                  `${transfer.numericId} - Transfer: ${transfer._id}`,
                );
                list.push(`ObjectId("${tx.account}")`);
              }
            }
            return list;
          }),
      );
      ++query.page;
    } while (query.page < transfersList.lastPage);
    return Promise.all(promises).then((rta) => {
      const flat = rta.flat();
      return {
        statusCode: 200,
        data: {
          count: flat.length,
          list: flat,
        },
      };
    });
  }
  // ----------------------------

  @ApiExcludeEndpoint()
  @Post('credit')
  // @CheckPoliciesAbility(new PolicyHandlerTransferCreate())
  async createOneCredit(
    @Body() createTransferDto: TransferCreateDto,
    @Request() req,
  ) {
    createTransferDto.userCreator = req?.user?.id;
    if (createTransferDto.isApprove || createTransferDto.isManualTx) {
      createTransferDto.userApprover = req?.user?.id;
    }
    createTransferDto.operationType = OperationTransactionType.credit;
    return this.transferService.newTransfer(createTransferDto);
  }

  @Post('withdrawal')
  // @CheckPoliciesAbility(new PolicyHandlerTransferCreate())
  async createOneWithdrawal(
    @Body() createTransferDto: TransferCreateDto,
    @Request() req,
  ) {
    createTransferDto.userCreator = req?.user?.id;
    if (createTransferDto.isApprove || createTransferDto.isManualTx) {
      createTransferDto.userApprover = req?.user?.id;
    }
    createTransferDto.operationType = OperationTransactionType.withdrawal;
    return this.transferService.newTransfer(createTransferDto);
  }

  @ApiExcludeEndpoint()
  @Post('debit')
  // @CheckPoliciesAbility(new PolicyHandlerTransferCreate())
  async createOneDebit(
    @Body() createTransferDto: TransferCreateDto,
    @Request() req,
  ) {
    createTransferDto.userCreator = req?.user?.id;
    if (createTransferDto.isApprove || createTransferDto.isManualTx) {
      createTransferDto.userApprover = req?.user?.id;
    }
    createTransferDto.operationType = OperationTransactionType.debit;
    return this.transferService.newTransfer(createTransferDto);
  }

  @ApiExcludeEndpoint()
  @Post('chargeback')
  // @CheckPoliciesAbility(new PolicyHandlerTransferCreate())
  async createOneChargeback(
    @Body() createTransferDto: TransferCreateDto,
    @Request() req,
  ) {
    createTransferDto.userCreator = req?.user?.id;
    if (createTransferDto.isApprove || createTransferDto.isManualTx) {
      createTransferDto.userApprover = req?.user?.id;
    }
    createTransferDto.operationType = OperationTransactionType.chargeback;
    return this.transferService.newTransfer(createTransferDto);
  }

  @ApiExcludeEndpoint()
  @Post('all')
  // @CheckPoliciesAbility(new PolicyHandlerTransferCreate())
  async createMany(
    @Body(new ParseArrayPipe({ items: TransferCreateDto }))
    createTransfersDto: TransferCreateDto[],
    @Request() req,
  ) {
    for (const createTransferDto of createTransfersDto) {
      createTransferDto.userCreator = req?.user?.id;
      if (createTransferDto.isApprove || createTransferDto.isManualTx) {
        createTransferDto.userApprover = req?.user?.id;
      }
    }
    return this.transferService.newManyTransfer(createTransfersDto);
  }

  @ApiExcludeEndpoint()
  @Patch()
  // @CheckPoliciesAbility(new PolicyHandlerTransferUpdate())
  async updateOne(@Body() updateTransferDto: TransferUpdateDto) {
    return this.transferService.updateTransfer(updateTransferDto);
  }

  @ApiExcludeEndpoint()
  @Post('latam-cashier')
  // @CheckPoliciesAbility(new PolicyHandlerTransferUpdate())
  @ApiTags('Integration Lead')
  @ApiKeyCheck()
  @UseGuards(ApiKeyAffiliateAuthGuard)
  @ApiHeader({
    name: 'b2crypto-affiliate-key',
    description: 'The affiliate secret key',
  })
  @ApiResponse({
    status: 200,
    description: 'was searched successfully',
    type: TransferEntity,
  })
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(400))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(403))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(404))
  @ApiResponse(ResponseB2Crypto.getResponseSwagger(500))
  async updateFromLatamCashier(
    @Body() updateTransferDto: TransferUpdateFromLatamCashierDto,
  ) {
    return this.transferService.updateTransferFromLatamCashier(
      updateTransferDto,
    );
  }

  @ApiExcludeEndpoint()
  @Patch('approve')
  // @CheckPoliciesAbility(new PolicyHandlerTransferUpdate())
  async approveOne(
    @Body() approveOrRejectTransferDto: ApproveOrRejectDepositDto,
    @Request() req,
  ) {
    approveOrRejectTransferDto.userApprover = req?.user?.id;
    return this.transferService.approveTransfer(approveOrRejectTransferDto);
  }

  @ApiExcludeEndpoint()
  @Patch('send-to-crm')
  // @CheckPoliciesAbility(new PolicyHandlerTransferUpdate())
  async sendToCrm(
    @Body() approveOrRejectTransferDto: ApproveOrRejectDepositDto,
  ) {
    // TODO[hender - 15/feb/2024] Add to routes mapping
    return this.transferService.sendToCrm(approveOrRejectTransferDto);
  }

  @ApiExcludeEndpoint()
  @Patch('reject')
  // @CheckPoliciesAbility(new PolicyHandlerTransferUpdate())
  async rejectOne(
    @Body() approveOrRejectTransferDto: ApproveOrRejectDepositDto,
    @Request() req,
  ) {
    approveOrRejectTransferDto.userRejecter = req?.user?.id;
    return this.transferService.rejectTransfer(approveOrRejectTransferDto);
  }

  @ApiExcludeEndpoint()
  @Patch('all')
  // @CheckPoliciesAbility(new PolicyHandlerTransferUpdate())
  async updateMany(
    @Body(new ParseArrayPipe({ items: TransferUpdateDto }))
    updateTransfersDto: TransferUpdateDto[],
  ) {
    return this.transferService.updateManyTransfer(updateTransfersDto);
  }

  @ApiExcludeEndpoint()
  @Delete('all')
  // @CheckPoliciesAbility(new PolicyHandlerTransferDelete())
  async deleteManyById(
    @Body(new ParseArrayPipe({ items: TransferUpdateDto }))
    ids: TransferUpdateDto[],
  ) {
    return this.transferService.deleteManyTransfer(
      ids.map((transfer) => transfer.id.toString()),
    );
  }

  @ApiExcludeEndpoint()
  @Delete(':transferID')
  // @CheckPoliciesAbility(new PolicyHandlerTransferDelete())
  async deleteOneById(@Param('transferID') id: string) {
    return this.transferService.deleteTransfer(id);
  }

  @AllowAnon()
  @EventPattern(EventsNamesTransferEnum.sendLast6hHistoryCardPurchases)
  // @CheckPoliciesAbility(new PolicyHandlerTransferCreate())
  async sendLast6hHistoryCardPurchasesEvent(
    @Payload() shortData = true,
    @Ctx() ctx?: RmqContext,
  ) {
    CommonService.ack(ctx);
    await this.transferService.sendLast6hHistoryCardPurchases(!!shortData);
    return true;
  }

  @AllowAnon()
  @EventPattern(EventsNamesTransferEnum.sendLast6hHistoryCardWalletDeposits)
  // @CheckPoliciesAbility(new PolicyHandlerTransferCreate())
  async sendLast6hHistoryCardWalletDepositsEvent(
    @Payload() shortData = true,
    @Ctx() ctx?: RmqContext,
  ) {
    CommonService.ack(ctx);
    await this.transferService.sendLast6hHistoryCardWalletDeposits(!!shortData);
    return true;
  }

  @AllowAnon()
  @EventPattern(EventsNamesTransferEnum.sendLast6hHistory)
  // @CheckPoliciesAbility(new PolicyHandlerTransferCreate())
  async sendLast6hHistory(
    @Payload() shortData = true,
    @Ctx() ctx?: RmqContext,
  ) {
    CommonService.ack(ctx);
    await this.transferService.sendLast6hHistoryCardWalletDeposits(!!shortData);
    await this.transferService.sendLast6hHistoryCardPurchases(!!shortData);
    return true;
  }

  @AllowAnon()
  @MessagePattern(EventsNamesTransferEnum.findAll)
  findAllEvent(@Payload() query: QuerySearchAnyDto, @Ctx() ctx?: RmqContext) {
    CommonService.ack(ctx);
    return this.findAll(query);
  }

  @AllowAnon()
  @MessagePattern(EventsNamesTransferEnum.createOneDepositLink)
  async createOneDepositPaymentLinkEvent(
    @Payload() createTransferButtonDto: TransferCreateButtonDto,
    @Ctx() ctx?: RmqContext,
  ) {
    CommonService.ack(ctx);
    if (!createTransferButtonDto.creator) {
      throw new BadRequestException('Missing creator');
    }
    if (
      !createTransferButtonDto.public_key &&
      !createTransferButtonDto.account
    ) {
      throw new BadRequestException('Missing public_key and account');
    }
    const createTransferDto: TransferCreateDto = new TransferCreateDto();
    // Configure CallBack
    createTransferDto.userCreator = createTransferButtonDto.creator;
    createTransferDto.name = createTransferButtonDto.identifier;
    createTransferDto.description = createTransferButtonDto.details;
    createTransferDto.page = createTransferButtonDto.host;
    createTransferDto.amount = parseFloat(createTransferButtonDto.amount);
    createTransferDto.currency = createTransferButtonDto.currency;
    createTransferDto.account = createTransferButtonDto.account;
    createTransferDto.typeAccount = createTransferButtonDto.typeAccount;
    createTransferDto.typeAccountType = createTransferButtonDto.typeAccountType;
    if (!createTransferButtonDto.account) {
      const list = await this.affliateService.getAll({
        where: {
          publicKey: createTransferButtonDto.public_key,
        },
      });
      const affiliate = list.list[0];
      if (!affiliate) {
        throw new BadRequestException('Affiliate not found');
      }
      if (!affiliate.account) {
        throw new BadRequestException('Account not found');
      }
      createTransferDto.account = affiliate.account.toString();
    }
    // Is NoApply because this operation generate a deposit address, not a transfer
    createTransferDto.operationType = OperationTransactionType.noApply;
    const depositLinkCategory = await this.getDepositLinkCategory();
    createTransferDto.typeTransaction = depositLinkCategory._id.toString();
    const transfer = await this.transferService.newTransfer(createTransferDto);
    return transfer;
  }
  @AllowAnon()
  @MessagePattern(EventsNamesTransferEnum.createMany)
  createManyEvent(createsDto: CreateAnyDto[], ctx: RmqContext) {
    throw new NotImplementedException('Method not implemented.');
  }

  @AllowAnon()
  @MessagePattern(EventsNamesTransferEnum.updateMany)
  updateManyEvent(updatesDto: UpdateAnyDto[], ctx: RmqContext) {
    throw new NotImplementedException('Method not implemented.');
  }

  @AllowAnon()
  @MessagePattern(EventsNamesTransferEnum.deleteMany)
  deleteManyByIdEvent(ids: UpdateAnyDto[], ctx: RmqContext) {
    throw new NotImplementedException('Method not implemented.');
  }

  @AllowAnon()
  @MessagePattern(EventsNamesTransferEnum.deleteOneById)
  deleteOneByIdEvent(id: string, ctx: RmqContext) {
    throw new NotImplementedException('Method not implemented.');
  }

  @AllowAnon()
  @MessagePattern(EventsNamesTransferEnum.findOneById)
  async findOneByIdEvent(
    @Payload() transferId: string,
    @Ctx() ctx: RmqContext,
  ) {
    CommonService.ack(ctx);
    return this.transferService.getOne(transferId);
  }

  @AllowAnon()
  @MessagePattern(EventsNamesTransferEnum.findOneByIdToCrmSend)
  async findOneByIdToCrmSendEvent(
    @Payload() transferId: string,
    @Ctx() ctx: RmqContext,
  ) {
    CommonService.ack(ctx);
    return this.transferService
      .getAll({
        where: {
          _id: transferId,
        },
        relations: ['pspAccount'],
      })
      .then((transfer) => transfer.list[0]);
  }

  @AllowAnon()
  @MessagePattern(EventsNamesTransferEnum.findByLead)
  async findByLead(@Payload() leadId: string, @Ctx() ctx: RmqContext) {
    CommonService.ack(ctx);
    return this.transferService.getByLead(leadId);
  }

  @AllowAnon()
  @MessagePattern(EventsNamesTransferEnum.createOne)
  async createOneEvent(
    @Payload() createTransferDto: TransferCreateDto,
    @Ctx() ctx: RmqContext,
  ) {
    CommonService.ack(ctx);
    const transfer = await this.transferService.newTransfer(createTransferDto);
    return transfer;
  }

  @AllowAnon()
  @EventPattern(EventsNamesTransferEnum.createOneWebhook)
  async createOneWebhook(
    @Payload() webhookTransferDto: any,
    @Ctx() ctx: RmqContext,
  ) {
    try {
      CommonService.ack(ctx);

      const crm = await this.builder.getPromiseCrmEventClient(
        EventsNamesCrmEnum.findOneByName,
        webhookTransferDto.integration,
      );
      if (!crm) {
        Logger.error(
          `CRM ${webhookTransferDto.integration} was not found`,
          'WebhookTransfer CRM',
        );
        return;
      }

      const status = await this.builder.getPromiseStatusEventClient(
        EventsNamesStatusEnum.findOneByName,
        webhookTransferDto.status,
      );
      if (!status) {
        Logger.error(
          `Status ${webhookTransferDto.status} was not found`,
          'WebhookTransfer Status',
        );
        return;
      }
      const cardId = webhookTransferDto?.requestBodyJson?.card?.id ?? '';
      // let accountBrand = null;
      // if (webhookTransferDto.integration == 'Sales') {
      //   const accountBrand = await this.builder.getPromiseAccountEventClient(
      //     EventsNamesAccountEnum.findAll,
      //     {
      //       where: {
      //         accountType: WalletTypesAccountEnum.VAULT,
      //         type: TypesAccountEnum.WALLET,
      //         owner: { $exists: false },
      //         accountId: 'TRX_USDT_S2UZ',
      //       },
      //     },
      //   );
      // }
      const account = await this.builder.getPromiseAccountEventClient(
        EventsNamesAccountEnum.findOneByCardId,
        {
          id: cardId,
        },
      );

      if (!account) {
        Logger.error(
          `Account by card ${cardId} was not found`,
          'WebhookTransfer Account',
        );
        return;
      }

      const movement =
        PomeloProcessEnum[
          webhookTransferDto.requestBodyJson?.transaction?.type
        ];
      const category = await this.builder.getPromiseCategoryEventClient(
        EventsNamesCategoryEnum.findOneByNameType,
        {
          slug: CommonService.getSlug(movement),
          type: TagEnum.MONETARY_TRANSACTION_TYPE,
        },
      );
      if (!category) {
        Logger.error(
          `Category by slug ${movement} was not found`,
          'WebhookTransfer Category',
        );
        return;
      }

      const transferDto: TransferCreateDto = new TransferCreateDto();
      transferDto.crm = crm;
      transferDto.status = status;
      transferDto.account = account;
      transferDto.typeAccount = account.type;
      transferDto.typeAccountType = account.accountType;
      transferDto.userAccount = account.owner;
      transferDto.typeTransaction = category;
      transferDto.amount = webhookTransferDto.amount;
      transferDto.amountCustodial = webhookTransferDto.amountCustodial;
      transferDto.currency = webhookTransferDto.currency;
      transferDto.currencyCustodial = webhookTransferDto.currencyCustodial;
      transferDto.statusPayment = webhookTransferDto.status;
      transferDto.description = webhookTransferDto.description;
      transferDto.operationType = webhookTransferDto.operationType;
      transferDto.requestBodyJson = webhookTransferDto.requestBodyJson;
      transferDto.requestHeadersJson = webhookTransferDto.requestHeadersJson;
      transferDto.descriptionStatusPayment =
        webhookTransferDto.descriptionStatusPayment;
      transferDto.confirmedAt = new Date();

      await this.transferService.newTransfer(transferDto);
    } catch (error) {
      Logger.error(error, 'WebhookTransfer');
    }
  }

  @AllowAnon()
  @MessagePattern(EventsNamesTransferEnum.updateOne)
  async updateOneEvent(
    @Payload() updateTransferDto: TransferUpdateDto,
    @Ctx() ctx: RmqContext,
  ) {
    CommonService.ack(ctx);
    return this.transferService.updateTransfer(updateTransferDto);
  }

  @AllowAnon()
  @EventPattern(EventsNamesTransferEnum.checkTransfersForPspAccountStats)
  async checkAllLeadsForPspAccountStats(
    @Payload() pspAccountId: string,
    @Ctx() ctx: RmqContext,
  ) {
    // TODO[hender] Refactor on ".service"
    await this.builder.getPromiseStatsEventClient(
      EventsNamesStatsEnum.removeAllStatsPspAccount,
      {
        pspAccount: pspAccountId,
      },
    );
    let page = 1;
    let nextPage = 2;
    const pspAccountStats = {
      id: pspAccountId,
      ...this.getResetStats(),
    } as PspAccountInterface;
    while (nextPage != 1) {
      const transfersToCheck = await this.transferService.getAll({
        page,
        relations: ['lead'],
        where: {
          pspAccount: pspAccountId,
        },
      });
      await this.builder.getPromiseStatsEventClient(
        EventsNamesStatsEnum.checkAllStatsPspAccount,
        {
          list: transfersToCheck.list,
        },
      );
      page = transfersToCheck.nextPage;
      nextPage = transfersToCheck.nextPage;
      Logger.log(
        `Saved page of PSP ACCOUNT ${pspAccountId} lead's. ${transfersToCheck.currentPage} / ${transfersToCheck.lastPage} pages`,
        TransferServiceController.name,
      );
    }
    const listStatsPspAccount = await this.builder.getPromiseStatsEventClient(
      EventsNamesStatsEnum.findAllStatsPspAccount,
      {
        where: {
          pspAccount: pspAccountId,
        },
      },
    );
    this.updateStat(pspAccountStats, listStatsPspAccount.list);
    await this.builder.getPromisePspAccountEventClient(
      EventsNamesPspAccountEnum.updateOne,
      pspAccountStats,
    );
    CommonService.ack(ctx);
  }

  @AllowAnon()
  @EventPattern(EventsNamesTransferEnum.checkTransferStatsByQuery)
  async checkTransferStatsByQuery(
    @Payload() query: QuerySearchAnyDto,
    @Ctx() ctx: RmqContext,
  ) {
    CommonService.ack(ctx);
    //return this.transferService.checkTransferStatsByQuery(query);
  }

  private async getDepositLinkCategory() {
    return this.builder.getPromiseCategoryEventClient(
      EventsNamesCategoryEnum.findOneByNameType,
      {
        slug: 'deposit-link',
        type: TagEnum.MONETARY_TRANSACTION_TYPE,
      },
    );
  }

  private async filterFromUserPermissions(
    query: QuerySearchAnyDto,
    req,
  ): Promise<QuerySearchAnyDto> {
    const user = req?.user;
    if (user) {
      query.where = query.where ?? {};
      const psps = [];
      const crms = [];
      const brands = [];
      const affiliates = [];
      let isSuperadmin = false;
      for (const permission of user.permissions) {
        if (permission.action === ActionsEnum.MANAGE) {
          isSuperadmin = true;
          break;
        }
        if (permission.scope) {
          if (permission.scope.resourceName === ResourcesEnum.BRAND) {
            brands.push(permission.scope.resourceId);
          } else if (permission.scope.resourceName === ResourcesEnum.CRM) {
            crms.push(permission.scope.resourceId);
          } else if (permission.scope.resourceName === ResourcesEnum.PSP) {
            psps.push(permission.scope.resourceId);
          } else if (
            permission.scope.resourceName === ResourcesEnum.AFFILIATE
          ) {
            affiliates.push(permission.scope.resourceId);
          }
        }
      }
      if (!isSuperadmin) {
        if (brands.length) {
          query.where.brand = {
            $in: brands,
          };
        }
        if (psps.length) {
          query.where.psps = {
            $in: psps,
          };
        }
        if (crms.length) {
          query.where.crm = {
            $in: crms,
          };
        }
        if (affiliates.length) {
          query.where.affiliate = {
            $in: affiliates,
          };
        }
      }
      if (req.user?.userParent) {
        //TODO[hender - 14/02/2024] If userParent,search only data of affiliates with userParent as user
        const affiliates = await this.builder.getPromiseAffiliateEventClient(
          EventsNamesAffiliateEnum.findAll,
          {
            take: 100000,
            where: {
              user: req.user?.userParent,
            },
          },
        );
        query.where.affiliate = {
          $in: affiliates.list.map((affiliate) => affiliate._id),
        };
      }
    }
    return query;
  }

  private async updateOperationTypeOneFromPageAffiliate(
    req: Request,
    updatePaymentTransferDto: TransferUpdateWithdrawalDto,
    operationType: OperationTransactionType,
  ) {
    const query = {
      where: {
        _id: updatePaymentTransferDto.id,
        affiliate: await this.transferService.getAffiliateIsAdmin(
          req['affiliate'],
        ),
        operationType: operationType,
      },
    };
    const transfer = await this.transferService.updateTransferByIdPayment(
      updatePaymentTransferDto,
      query,
    );
    return new TransferAffiliateResponseDto(transfer);
  }

  private getResetStats() {
    return {
      quantityLeads: 0,
      totalLeads: 0,
      quantityFtd: 0,
      totalFtd: 0,
      quantityCftd: 0,
      totalCftd: 0,
      totalConversion: 0,
      quantityAffiliateFtd: 0,
      totalAffiliateFtd: 0,
      totalAffiliateConversion: 0,
    };
  }

  private updateStat(
    stats: PspAccountInterface | PspInterface,
    listStats: Array<StatsDatePspAccountDocument>,
  ) {
    for (const stat of listStats) {
      stats.quantityLeads += stat.quantityLeads;
      stats.totalLeads += stat.totalLeads;
      stats.quantityFtd += stat.quantityFtd;
      stats.totalFtd += stat.totalFtd;
      stats.quantityCftd += stat.quantityCftd;
      stats.totalCftd += stat.totalCftd;
      stats.totalConversion += stat.conversion;
      stats.quantityAffiliateFtd += stat.quantityApprovedLead;
      stats.totalAffiliateFtd += stat.totalApprovedLead;
      stats.totalAffiliateConversion += stat.conversionApprovedLead;
    }
  }

  private getTransferToAffiliate(
    paginator: ResponsePaginator<TransferDocument>,
  ): ResponsePaginator<TransferAffiliateResponseDto> {
    const rta: ResponsePaginator<TransferAffiliateResponseDto> =
      new ResponsePaginator<TransferAffiliateResponseDto>();
    rta.list = [];
    rta.currentPage = paginator.currentPage;
    rta.elementsPerPage = paginator.elementsPerPage;
    rta.firstPage = paginator.firstPage;
    rta.lastPage = paginator.lastPage;
    rta.nextPage = paginator.nextPage;
    rta.order = paginator.order;
    rta.prevPage = paginator.prevPage;
    rta.totalElements = paginator.totalElements;
    for (const transfer of paginator.list) {
      rta.list.push(new TransferAffiliateResponseDto(transfer));
    }
    return rta;
  }
}
