import { AllowAnon } from '@auth/auth/decorators/allow-anon.decorator';
import { BuildersService } from '@builder/builders';
import { StatusCashierEnum } from '@common/common/enums/StatusCashierEnum';
import TagEnum from '@common/common/enums/TagEnum';
import {
  BadRequestException,
  Body,
  Controller,
  Inject,
  Logger,
  Post,
  Req,
} from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { TransferCreateDto } from '@transfer/transfer/dto/transfer.create.dto';
import { OperationTransactionType } from '@transfer/transfer/enum/operation.transaction.type.enum';
import EventsNamesAccountEnum from 'apps/account-service/src/enum/events.names.account.enum';
import EventsNamesCategoryEnum from 'apps/category-service/src/enum/events.names.category.enum';
import EventsNamesPspAccountEnum from 'apps/psp-service/src/enum/events.names.psp.acount.enum';
import EventsNamesStatusEnum from 'apps/status-service/src/enum/events.names.status.enum';
import EventsNamesTransferEnum from 'apps/transfer-service/src/enum/events.names.transfer.enum';
import { isEmpty } from 'class-validator';

@Controller('b2binpay')
//@UseGuards(ApiKeyAuthGuard)
export class B2BinPayNotificationsController {
  constructor(
    private readonly builder: BuildersService,
    @Inject(SchedulerRegistry)
    private schedulerRegistry: SchedulerRegistry,
  ) {}

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
    const headers = req.headers;
    const body = req.body;
    Logger.debug(
      headers,
      'B2BinPayNotificationsController.status:request.headers',
    );
    Logger.debug(body, 'B2BinPayNotificationsController.status:request.body');
    const attributes = data.data.attributes;
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
      if (transfer.status === 3) {
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
    } catch (err) {}

    return {
      statusCode: 200,
      data: 'Tx updated',
    };
  }
}
