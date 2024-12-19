import { AccountDocument } from '@account/account/entities/mongoose/account.schema';
import { AllowAnon } from '@auth/auth/decorators/allow-anon.decorator';
import { BuildersService } from '@builder/builders';
import { CommonService } from '@common/common';
import { StatusCashierEnum } from '@common/common/enums/StatusCashierEnum';
import TagEnum from '@common/common/enums/TagEnum';
import { ResponsePaginator } from '@common/common/interfaces/response-pagination.interface';
import { IntegrationService } from '@integration/integration';
import { Body, Controller, Inject, Logger, Post, Req } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { TransferCreateDto } from '@transfer/transfer/dto/transfer.create.dto';
import { OperationTransactionType } from '@transfer/transfer/enum/operation.transaction.type.enum';
import EventsNamesAccountEnum from 'apps/account-service/src/enum/events.names.account.enum';
import EventsNamesCategoryEnum from 'apps/category-service/src/enum/events.names.category.enum';
import EventsNamesPspAccountEnum from 'apps/psp-service/src/enum/events.names.psp.acount.enum';
import EventsNamesStatusEnum from 'apps/status-service/src/enum/events.names.status.enum';
import EventsNamesTransferEnum from 'apps/transfer-service/src/enum/events.names.transfer.enum';

@Controller('b2binpay')
//@UseGuards(ApiKeyAuthGuard)
export class B2BinPayNotificationsController {
  constructor(
    private readonly builder: BuildersService,
    @Inject(IntegrationService)
    private integrationService: IntegrationService,
  ) {}
  //private readonly integrationServiceService: PomeloIntegrationProcessService,

  // ----------------------------
  @AllowAnon()
  @Post('status-deposit')
  // @CheckPoliciesAbility(new PolicyHandlerTransferRead())
  async statusDeposit(@Req() req: any, @Body() data: any) {
    Logger.debug(data, 'B2BinPayNotificationsController.statusDeposit');
    Logger.debug(
      req.headers,
      'B2BinPayNotificationsController.statusDeposit:request.headers',
    );
    Logger.debug(
      req.body,
      'B2BinPayNotificationsController.statusDeposit:request.body',
    );
    return {
      statusCode: 200,
      data: 'Tx updated deposit',
    };
  }

  @AllowAnon()
  @Post('status')
  // @CheckPoliciesAbility(new PolicyHandlerTransferRead())
  async status(@Req() req: any, @Body() data: any) {
    Logger.debug(data, 'B2BinPayNotificationsController.status');
    const headers = req?.headers;
    const body = req?.body;
    Logger.debug(
      headers,
      'B2BinPayNotificationsController.status:request.headers',
    );
    Logger.debug(body, 'B2BinPayNotificationsController.status:request.body');
    Logger.debug(data, 'B2BinPayNotificationsController.status:body');
    /* const attributes = data.data.attributes;
    const relationships = data.data.relationships;
    const transferId = relationships.transfer?.data?.id;
    const currencyId = relationships.currency?.data?.id;
    if (!transferId) {
      throw new BadRequestException('Transfer not found');
    }
    const transfer = data.included.filter((entity) => {
      return entity.id === transferId;
    })[0].attributes;
    if (transfer.status === 2) {
      // Created
      return {
        statusCode: 200,
        data: 'Tx created',
      };
    }
    //TODO[hender - 16/08/2024] Check currency
    const currency = data.included.filter((entity) => {
      return entity.id === currencyId;
    })[0].attributes;
    let transferList = null;
    if (isEmpty(attributes.tracking_id)) {
      throw new BadRequestException('B2BinPay trackingId not found');
    }
    try {
      const depositWalletCategory =
        await this.builder.getPromiseCategoryEventClient(
          EventsNamesCategoryEnum.findOneByNameType,
          {
            slug: 'deposit-wallet',
            type: TagEnum.MONETARY_TRANSACTION_TYPE,
          },
        );
      const approvedStatus = await this.builder.getPromiseStatusEventClient(
        EventsNamesStatusEnum.findOneByName,
        'approved',
      );
      const rejectedStatus = await this.builder.getPromiseStatusEventClient(
        EventsNamesStatusEnum.findOneByName,
        'rejected',
      );
      const internalPspAccount =
        await this.builder.getPromisePspAccountEventClient(
          EventsNamesPspAccountEnum.findOneByName,
          'internal',
        );
      transferList = await this.builder.getPromiseTransferEventClient(
        EventsNamesTransferEnum.findAll,
        {
          where: {
            _id: attributes.tracking_id,
          },
          relations: ['account'],
        },
      );
      const transferEntity = transferList.list[0];
      if (!transferEntity) {
        throw new BadRequestException('Transfer not found');
      }
      const account = transferEntity.account;
      if (!account) {
        throw new BadRequestException('B2BinPay Account not found');
      }
      let status = rejectedStatus;
      // Verify exist transfer
      if (transfer.status === 2) {
        // Paid
        status = approvedStatus;
        this.builder.emitAccountEventClient(
          EventsNamesAccountEnum.customUpdateOne,
          {
            id: account._id,
            $inc: {
              amount: transfer.amount,
            },
          },
        );
      }
      this.builder.emitTransferEventClient(EventsNamesTransferEnum.createOne, {
        name: `Deposit wallet ${account.name}`,
        description: `Deposit wallet ${account.name}`,
        currency: account.currency,
        amount: transfer.amount,
        currencyCustodial: account.currencyCustodial,
        amountCustodial: transfer.amount,
        requestHeadersJson: headers,
        requestBodyJson: body,
        account: account._id,
        typeAccount: account.type,
        typeAccountType: account.accountType,
        userCreator: req?.user?.id,
        userAccount: account.owner,
        typeTransaction: depositWalletCategory._id,
        psp: internalPspAccount.psp,
        pspAccount: internalPspAccount._id,
        operationType: OperationTransactionType.withdrawal,
        statusPayment: StatusCashierEnum.APPROVED,
        approve: true,
        status: status._id,
        brand: account.brand,
        crm: account.crm,
        confirmedAt: new Date(),
        approvedAt: new Date(),
      } as unknown as TransferCreateDto);
    } catch (err) {} */

    return {
      statusCode: 200,
      data: 'Tx updated',
    };
  }

  @AllowAnon()
  @EventPattern(EventsNamesTransferEnum.checkTransferInB2BinPay)
  async checkTransferInB2BinPay(
    @Payload() typeIntegration: string,
    @Ctx() ctx: RmqContext,
  ) {
    CommonService.ack(ctx);
    Logger.log(typeIntegration, 'checkTransferInB2BinPay');
    let accounts: ResponsePaginator<AccountDocument> = {
      nextPage: 1,
      prevPage: 0,
      lastPage: 0,
      firstPage: 0,
      currentPage: 0,
      totalElements: 0,
      elementsPerPage: 0,
      order: [],
      list: [],
    };
    const promises = [];
    do {
      accounts = await this.builder.getPromiseAccountEventClient(
        EventsNamesAccountEnum.findAll,
        {
          page: accounts.nextPage,
          where: {
            'responseCreation.responseAccount.data.id': { $exists: true },
          },
        },
      );
      Logger.log(
        accounts.list.length,
        `checkTransferInB2BinPay.totalElements - page ${accounts.currentPage}`,
      );
      promises.push(this.checkAccounts(accounts));
    } while (accounts.nextPage !== accounts.firstPage);
    return Promise.all(promises);
  }

  private async checkAccounts(accounts: ResponsePaginator<AccountDocument>) {
    const promises = [];
    for (const account of accounts.list) {
      const responseAccount = account.responseCreation?.responseAccount.data;
      if (responseAccount.id) {
        // const url = 'https://api.b2binpay.com';
        // const integration = await this.integrationService.getCryptoIntegration(
        //   account,
        //   IntegrationCryptoEnum.B2BINPAY,
        //   url,
        // );
        try {
          // const minute = 60 * 60 * 1000;
          // const now = new Date();
          // const listTransfers = await integration.getTransferByDeposit(
          //   responseAccount.id,
          //   1,
          //   {
          //     from: new Date(now.getTime() - minute).toISOString(),
          //     to: now.toISOString(),
          //   },
          // );
          // if (listTransfers?.data) {
          //   for (const transfer of listTransfers.data) {
          //     promises.push(this.checkTransfer(account, transfer));
          //   }
          // } else {
          //   Logger.error(listTransfers, `checkAccounts-${responseAccount.id}`);
          // }
        } catch (err) {
          Logger.error(err, `checkAccounts-${responseAccount.id}`);
        }
      }
    }
    return Promise.all(promises);
  }
  private async checkTransfer(account, transfer) {
    return new Promise(async (res) => {
      const attributes = transfer.attributes;
      if (attributes.status !== 2) {
        res(false);
      }
      const transfers = await this.builder.getPromiseTransferEventClient(
        EventsNamesTransferEnum.findAll,
        {
          where: {
            crmTransactionId: transfer.id,
          },
        },
      );
      if (!transfers.totalElements) {
        const depositWalletCategory =
          await this.builder.getPromiseCategoryEventClient(
            EventsNamesCategoryEnum.findOneByNameType,
            {
              slug: 'deposit-wallet',
              type: TagEnum.MONETARY_TRANSACTION_TYPE,
            },
          );
        const internalPspAccount =
          await this.builder.getPromisePspAccountEventClient(
            EventsNamesPspAccountEnum.findOneByName,
            'internal',
          );
        const approvedStatus = await this.builder.getPromiseStatusEventClient(
          EventsNamesStatusEnum.findOneByName,
          'approved',
        );
        const dto = {
          name: `Deposit wallet ${account.name}`,
          description: `Deposit wallet ${account.name}`,
          currency: account.currency,
          amount: attributes.amount_target,
          crmTransactionId: transfer.id,
          responsePayment: transfer,
          currencyCustodial: account.currencyCustodial,
          amountCustodial: attributes.amount_target,
          account: account._id,
          userCreator: account.owner,
          userAccount: account.owner,
          typeTransaction: depositWalletCategory._id,
          psp: internalPspAccount.psp,
          pspAccount: internalPspAccount._id,
          operationType: OperationTransactionType.deposit,
          statusPayment: StatusCashierEnum.APPROVED,
          approve: true,
          status: approvedStatus._id,
          brand: account.brand,
          crm: account.crm,
          confirmedAt: new Date(),
          isApprove: true,
          approvedAt: attributes.updated_at,
        } as unknown as TransferCreateDto;
        Logger.log(dto.name, `checkTransfer-save-${transfer.id}`);
        this.builder.emitTransferEventClient(
          EventsNamesTransferEnum.createOne,
          dto,
        );
        res(true);
      }
    });
  }
}
