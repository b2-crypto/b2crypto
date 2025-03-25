import { CommisionTypeEnum } from '@account/account/enum/commision-type.enum';
import { Traceable } from '@amplication/opentelemetry-nestjs';
import { BuildersService } from '@builder/builders';
import { CardsEnum } from '@common/common/enums/messages.enum';
import TransportEnum from '@common/common/enums/TransportEnum';
import {
  Adjustment,
  Authorization,
  NotificationDto,
} from '@integration/integration/dto/pomelo.process.body.dto';
import { PomeloCache } from '@integration/integration/util/pomelo.integration.process.cache';
import {
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CommisionDetail,
  Transfer,
} from '@transfer/transfer/entities/mongoose/transfer.schema';
import { OperationTransactionType } from '@transfer/transfer/enum/operation.transaction.type.enum';
import EventsNamesAccountEnum from 'apps/account-service/src/enum/events.names.account.enum';
import EventsNamesMessageEnum from 'apps/message-service/src/enum/events.names.message.enum';
import EventsNamesTransferEnum from 'apps/transfer-service/src/enum/events.names.transfer.enum';
import mongoose from 'mongoose';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { FiatIntegrationClient } from '../clients/fiat.integration.client';
import { PomeloProcessEnum } from '../enums/pomelo.process.enum';
import { CommissionsTypeDescriptionMap } from '../maps/commisions-type.map';

@Traceable()
@Injectable()
export class PomeloIntegrationProcessService {
  constructor(
    @InjectPinoLogger(PomeloIntegrationProcessService.name)
    protected readonly logger: PinoLogger,
    private readonly cache: PomeloCache,
    private readonly currencyConversion: FiatIntegrationClient,
    private readonly builder: BuildersService,
    private readonly configService: ConfigService,
  ) {}

  private async process(
    process: any,
    idempotency: string,
    authorize: boolean,
    headers: any,
  ): Promise<any> {
    let response = await this.cache.getResponse(idempotency);

    response = typeof response === 'string' ? JSON.parse(response) : response;

    if (response == null) {
      response = await this.cache.setTooEarly(idempotency);
      const amount = await this.getAmount(process);

      //REVIEW - Check if transaction already executed
      // const transactionId = process.transaction.id;

      // const transactions = await this.builder.getPromiseTransferEventClient<{
      //   list: Transfer[];
      // }>(EventsNamesTransferEnum.findAll, {
      //   where: {
      //     'requestBodyJson.transaction.id': transactionId,
      //     leadCrmName: { $ne: 'Sales' },
      //   },
      // });

      // if (transactions.list.length > 0) {
      //   this.logger.info(
      //     `[executeProcess] Transaction already executed: ${JSON.stringify(
      //       transactions.list,
      //       null,
      //       2,
      //     )}`,
      //   );
      //   return this.buildProcessResponse(
      //     CardsEnum.CARD_PROCESS_TRANSACTION_EXISTS,
      //     authorize,
      //   );
      // }

      response = await this.executeProcess(process, authorize, amount.usd);
      await this.cache.setResponse(idempotency, response);
      await this.createTransferRecord(
        process,
        headers,
        response,
        amount,
        authorize,
      );
    }
    return response;
  }

  private isOperationHasParent(process: any): boolean {
    return [
      OperationTransactionType.refund,
      OperationTransactionType.reversal_deposit,
      OperationTransactionType.reversal_chargeback,
      OperationTransactionType.reversal_credit,
      OperationTransactionType.reversal_debit,
      OperationTransactionType.reversal_withdrawal,
      OperationTransactionType.reversal_refund,
      OperationTransactionType.reversal_payment,
      OperationTransactionType.reversal_extra_cash,
      OperationTransactionType.reversal_purchase,
    ].includes(process?.transaction?.type);
  }

  private isOperationHasReversal(process: any): boolean {
    return [
      OperationTransactionType.reversal_deposit,
      OperationTransactionType.reversal_chargeback,
      OperationTransactionType.reversal_credit,
      OperationTransactionType.reversal_debit,
      OperationTransactionType.reversal_withdrawal,
      OperationTransactionType.reversal_refund,
      OperationTransactionType.reversal_payment,
      OperationTransactionType.reversal_extra_cash,
      OperationTransactionType.reversal_purchase,
    ].includes(process?.transaction?.type);
  }

  private isOperationHasCommissions(process: any): boolean {
    return [
      OperationTransactionType.credit,
      OperationTransactionType.reversal_credit,
      OperationTransactionType.debit,
      OperationTransactionType.reversal_debit,
      OperationTransactionType.withdrawal,
      OperationTransactionType.reversal_withdrawal,
      OperationTransactionType.payment,
      OperationTransactionType.reversal_payment,
      OperationTransactionType.extra_cash,
      OperationTransactionType.reversal_extra_cash,
      OperationTransactionType.purchase,
      OperationTransactionType.reversal_purchase,
    ].includes(process?.transaction?.type);
  }

  private async findParentTransaction(process: any): Promise<Transfer | null> {
    const [parentTransaction] = (
      await this.builder.getPromiseTransferEventClient<{
        list: Transfer[];
      }>(EventsNamesTransferEnum.findAll, {
        where: {
          'requestBodyJson.transaction.id':
            process?.transaction?.original_transaction_id,
          // operationType: operationTypeParent,
          leadCrmName: { $ne: 'Sales' },
        },
      })
    ).list;

    return parentTransaction;
  }

  private async findParentCommissions(
    parentTransaction?: Transfer,
  ): Promise<Transfer[]> {
    return (
      await this.builder.getPromiseTransferEventClient<{
        list: Transfer[];
      }>(EventsNamesTransferEnum.findAll, {
        where: { _id: { $in: parentTransaction?.commisions ?? [] } },
      })
    ).list;
  }

  private buildNationalCommissionDetail({
    id,
    process,
    parentCommisionNational,
    transferAmount,
    transferAmountCustodial,
    percentageCommisionNational,
    transferCurrency,
    transferCurrencyCustodial,
  }: {
    id: mongoose.Types.ObjectId;
    process: any;
    parentCommisionNational: Transfer;
    percentageCommisionNational: number;
    transferAmount: number;
    transferAmountCustodial: number;
    transferCurrency: string;
    transferCurrencyCustodial: string;
  }): CommisionDetail {
    const isOperationHasReversal = this.isOperationHasReversal(process);
    const isOperationHasCommissions = this.isOperationHasCommissions(process);

    return {
      _id: id,
      amount: isOperationHasCommissions
        ? transferAmount * percentageCommisionNational /* isOperationHasReversal
          ? parentCommisionNational?.amount
          : transferAmount * percentageCommisionNational */
        : 0,
      amountCustodial: isOperationHasCommissions
        ? transferAmountCustodial *
          percentageCommisionNational /* isOperationHasReversal
          ? parentCommisionNational?.amountCustodial
          : transferAmountCustodial * percentageCommisionNational */
        : 0,
      currency: isOperationHasReversal
        ? parentCommisionNational?.currency
        : transferCurrency === 'USD'
        ? 'USDT'
        : transferCurrency,
      currencyCustodial: isOperationHasReversal
        ? parentCommisionNational?.currencyCustodial
        : transferCurrencyCustodial === 'USD'
        ? 'USDT'
        : transferCurrencyCustodial,
      commisionType: CommisionTypeEnum.NATIONAL,
    };
  }

  private buildInternationalCommissionDetail({
    id,
    process,
    parentCommisionInternational,
    percentageCommisionInternational,
    transferAmount,
    transferAmountCustodial,
    transferCurrency,
    transferCurrencyCustodial,
  }: {
    id: mongoose.Types.ObjectId;
    process: any;
    parentCommisionInternational: Transfer;
    percentageCommisionInternational: number;
    transferAmount: number;
    transferAmountCustodial: number;
    transferCurrency: string;
    transferCurrencyCustodial: string;
  }): CommisionDetail {
    const isOperationHasReversal = this.isOperationHasReversal(process);
    const isOperationHasCommissions = this.isOperationHasCommissions(process);

    return {
      _id: id,
      amount: isOperationHasCommissions
        ? transferAmount *
          percentageCommisionInternational /* isOperationHasReversal
          ? parentCommisionInternational?.amount
          : transferAmount * percentageCommisionInternational */
        : 0,
      amountCustodial: isOperationHasCommissions
        ? transferAmountCustodial *
          percentageCommisionInternational /* isOperationHasReversal
          ? parentCommisionInternational?.amountCustodial
          : transferAmountCustodial * percentageCommisionInternational */
        : 0,
      currency: isOperationHasReversal
        ? parentCommisionInternational?.currency
        : transferCurrency === 'USD'
        ? 'USDT'
        : transferCurrency,
      currencyCustodial: isOperationHasReversal
        ? parentCommisionInternational?.currencyCustodial
        : transferCurrencyCustodial === 'USD'
        ? 'USDT'
        : transferCurrencyCustodial,
      commisionType: CommisionTypeEnum.INTERNATIONAL,
    };
  }

  private buildTransaction({
    transactionId,
    commisionNationalTransactionId,
    commisionInternationalTransactionId,
    bodyProcess,
    headersProccess,
    response,
    parentTransaction,
    transferAmount,
    transferAmountCustodial,
    transferCurrency,
    transferCurrencyCustodial,
    commisionNationalDetail,
    commisionInternationalDetail,
  }: {
    transactionId: mongoose.Types.ObjectId;
    commisionNationalTransactionId: mongoose.Types.ObjectId;
    commisionInternationalTransactionId: mongoose.Types.ObjectId;
    bodyProcess: any;
    headersProccess: any;
    response: any;
    parentTransaction: Transfer;
    transferAmount: number;
    transferAmountCustodial: number;
    transferCurrency: string;
    transferCurrencyCustodial: string;
    commisionNationalDetail: CommisionDetail;
    commisionInternationalDetail: CommisionDetail;
  }) {
    // const isOperationHasReversal = this.isOperationHasReversal(bodyProcess);
    const isOperationHasCommissions =
      this.isOperationHasCommissions(bodyProcess);

    const pretransaction = {
      _id: transactionId,
      parentTransaction: null,
      integration: 'Pomelo',
      requestBodyJson: bodyProcess,
      requestHeadersJson: headersProccess,
      operationType:
        OperationTransactionType[bodyProcess?.transaction?.type?.toLowerCase()],
      status: response?.status ?? CardsEnum.CARD_PROCESS_OK,
      descriptionStatusPayment:
        response?.status_detail ?? CardsEnum.CARD_PROCESS_OK,
      description: response?.message ?? '',
      amount: transferAmount,
      amountCustodial: transferAmountCustodial,
      currency: transferCurrency === 'USD' ? 'USDT' : transferCurrency,
      currencyCustodial:
        transferCurrencyCustodial === 'USD'
          ? 'USDT'
          : transferCurrencyCustodial,
      showToOwner: true,
      isApprove: response?.status === CardsEnum.CARD_PROCESS_OK,
      commisions:
        bodyProcess.transaction.origin === CommisionTypeEnum.INTERNATIONAL
          ? [
              commisionNationalTransactionId,
              commisionInternationalTransactionId,
            ]
          : [commisionNationalTransactionId],
      amountComissions: isOperationHasCommissions
        ? bodyProcess.transaction.origin === CommisionTypeEnum.INTERNATIONAL
          ? commisionNationalDetail.amountCustodial +
            commisionInternationalDetail.amountCustodial
          : commisionNationalDetail.amountCustodial
        : 0,
      commisionsDetails:
        bodyProcess.transaction.origin === CommisionTypeEnum.INTERNATIONAL
          ? [commisionNationalDetail, commisionInternationalDetail]
          : [commisionNationalDetail],
    };

    return parentTransaction
      ? {
          ...pretransaction,
          parentTransaction: parentTransaction._id,
          parentTransactionDetail: {
            _id: parentTransaction._id,
            amount: parentTransaction.amount,
            currency: parentTransaction.currency,
            amountCustodial: parentTransaction.amountCustodial,
            currencyCustodial: parentTransaction.currencyCustodial,
            operationType: parentTransaction.operationType,
          },
          amount:
            /* isOperationHasReversal
            ? parentTransaction?.amount ?? pretransaction.amount
            : pretransaction.amount */ pretransaction.amount,
          currency:
            /* isOperationHasReversal
            ? parentTransaction?.currency ?? pretransaction.currency
            : pretransaction.currency */ pretransaction.currency,
          amountCustodial:
            /* isOperationHasReversal
            ? parentTransaction?.amountCustodial ??
              pretransaction.amountCustodial
            : pretransaction.amountCustodial */ pretransaction.amountCustodial,
          currencyCustodial:
            /* isOperationHasReversal
            ? parentTransaction?.currencyCustodial ??
              pretransaction.currencyCustodial
            : pretransaction.currencyCustodial */ pretransaction.currencyCustodial,
        }
      : pretransaction;
  }

  private async createTransferRecord(
    process: any,
    headers: any,
    response: any,
    amount: any,
    authorize?: boolean,
  ) {
    try {
      const percentageCommisionNational = parseFloat(
        this.configService.getOrThrow('COMMISION_NATIONAL'),
      );
      const percentageCommisionInternational = parseFloat(
        this.configService.getOrThrow('COMMISION_INTERNATIONAL'),
      );
      const transactionId = new mongoose.Types.ObjectId();
      const commisionNationalTransactionId = new mongoose.Types.ObjectId();
      const commisionInternationalTransactionId = new mongoose.Types.ObjectId();

      //============================================================
      //= Start - Find Parent Transaction
      //============================================================
      const parentTransaction = this.isOperationHasParent(process)
        ? await this.findParentTransaction(process)
        : null;

      this.logger.info(
        `[createTransferRecord] Parent Transaction: ${JSON.stringify(
          parentTransaction,
          null,
          2,
        )}`,
      );
      //============================================================

      //============================================================
      //= Start - Find Parent Commissions
      //============================================================
      const parentCommisions = parentTransaction
        ? await this.findParentCommissions(parentTransaction)
        : [];

      this.logger.info(
        `[createTransferRecord] Parent Commissions: ${JSON.stringify(
          parentCommisions,
          null,
          2,
        )}`,
      );
      //============================================================

      const parentCommisionNational = parentCommisions.find(
        (tx) => tx.commisionType === CommisionTypeEnum.NATIONAL,
      );

      const parentCommisionInternational = parentCommisions.find(
        (tx) => tx.commisionType === CommisionTypeEnum.INTERNATIONAL,
      );

      //============================================================
      //= Start - Build National Commission Detail
      //============================================================
      const commisionNationalDetail = this.buildNationalCommissionDetail({
        id: commisionNationalTransactionId,
        process,
        parentCommisionNational,
        percentageCommisionNational,
        transferAmount: amount.amount,
        transferAmountCustodial: amount.usd,
        transferCurrency: amount.from,
        transferCurrencyCustodial: amount.to,
      });

      this.logger.info(
        `[createTransferRecord] Commission National Detail: ${JSON.stringify(
          commisionNationalDetail,
          null,
          2,
        )}`,
      );
      //============================================================

      //============================================================
      //= Start - Build International Commission Detail
      //============================================================
      const commisionInternationalDetail =
        this.buildInternationalCommissionDetail({
          id: commisionInternationalTransactionId,
          process,
          parentCommisionInternational,
          percentageCommisionInternational,
          transferAmount: amount.amount,
          transferAmountCustodial: amount.usd,
          transferCurrency: amount.from,
          transferCurrencyCustodial: amount.to,
        });

      this.logger.info(
        `[createTransferRecord] Commission International Detail: ${JSON.stringify(
          commisionInternationalDetail,
          null,
          2,
        )}`,
      );
      //============================================================

      //============================================================
      //= Start - Build Transaction
      //============================================================
      const transaction = this.buildTransaction({
        transactionId,
        commisionNationalTransactionId,
        commisionInternationalTransactionId,
        bodyProcess: process,
        headersProccess: headers,
        response,
        parentTransaction,
        transferAmount: amount.amount,
        transferAmountCustodial: amount.usd,
        transferCurrency: amount.from,
        transferCurrencyCustodial: amount.to,
        commisionNationalDetail,
        commisionInternationalDetail,
      });

      this.logger.info(
        `[createTransferRecord] Transaction: ${JSON.stringify(
          transaction,
          null,
          2,
        )}`,
      );
      //============================================================

      this.builder.emitTransferEventClient(
        EventsNamesTransferEnum.createOneWebhook,
        transaction,
      );

      const amountUSD = amount.usd ?? amount.amount;

      if (authorize && amountUSD * percentageCommisionNational > 0) {
        const commisionNational = {
          ...commisionNationalDetail,
          parentTransaction: transactionId,
          integration: 'Sales',
          requestBodyJson: process,
          requestHeadersJson: headers,
          operationType: transaction.operationType,
          status: response?.status ?? CardsEnum.CARD_PROCESS_OK,
          descriptionStatusPayment:
            response?.status_detail ?? CardsEnum.CARD_PROCESS_OK,
          description: response?.message ?? '',
          page:
            CommissionsTypeDescriptionMap.get(transaction.operationType) ??
            'Commision to B2Fintech',
          showToOwner: false,
          commisionsDetails: [],
          isApprove: response?.status === CardsEnum.CARD_PROCESS_OK,
        };

        this.logger.info(
          `[createTransferRecord] Commision National: ${JSON.stringify(
            commisionNational,
            null,
            2,
          )}`,
        );

        this.builder.emitTransferEventClient(
          EventsNamesTransferEnum.createOneWebhook,
          commisionNational,
        );
      }

      if (
        authorize &&
        amountUSD * percentageCommisionInternational > 0 &&
        process.transaction.origin === CommisionTypeEnum.INTERNATIONAL
      ) {
        const commisionInternational = {
          ...commisionInternationalDetail,
          parentTransaction: transactionId,
          integration: 'Sales',
          requestBodyJson: process,
          requestHeadersJson: headers,
          operationType: transaction.operationType,
          status: response?.status ?? CardsEnum.CARD_PROCESS_OK,
          descriptionStatusPayment:
            response?.status_detail ?? CardsEnum.CARD_PROCESS_OK,
          description: response?.message ?? '',
          page:
            CommissionsTypeDescriptionMap.get(transaction.operationType) ??
            'Commision to B2Fintech',
          showToOwner: false,
          commisionsDetails: [commisionNationalDetail],
          isApprove: response?.status === CardsEnum.CARD_PROCESS_OK,
        };

        this.logger.info(
          `[createTransferRecord] Commision International: ${JSON.stringify(
            commisionInternational,
            null,
            2,
          )}`,
        );

        this.builder.emitTransferEventClient(
          EventsNamesTransferEnum.createOneWebhook,
          commisionInternational,
        );
      }
    } catch (error) {
      this.logger.info(
        `[createTransferRecord] Error creating transfer: ${
          error.message || error
        }`,
      );
    }
  }

  private async getAmount(txn: any) {
    const to = process.env.DEFAULT_CURRENCY_CONVERSION_COIN;
    const from = txn.amount.local.currency;
    const amount = txn.amount.local.total;
    const conversion = `to: ${to} | from: ${from} | amount: ${amount}`;

    this.logger.info(`[getAmount] ${conversion}`);

    const usd =
      parseInt(amount) > 0
        ? await this.currencyConversion.getCurrencyConversion(to, from, amount)
        : 0;

    return {
      to,
      from,
      amount,
      usd,
    };
  }

  private async executeProcess(
    process: any,
    authorize: boolean,
    usdAmount: number,
  ): Promise<any> {
    try {
      const percentageCommisionNational = parseFloat(
        this.configService.getOrThrow('COMMISION_NATIONAL'),
      );
      const percentageCommisionInternational = parseFloat(
        this.configService.getOrThrow('COMMISION_INTERNATIONAL'),
      );
      this.logger.info('[executeProcess] ExecuteProcess start');
      /* if (
        process?.installments &&
        parseInt(process?.installments?.quantity) > 1
      ) {
        this.logger.info(
          'Invalid Installments: ' + process?.installments?.quantity,
          'ExecuteProcess',
        );
        return this.buildErrorResponse(
          CardsEnum.CARD_PROCESS_INVALID_INSTALLMENTS,
          authorize,
        );
      } */

      const cardId = process?.card?.id || '';
      const movement = PomeloProcessEnum[process?.transaction?.type];
      if (usdAmount < 0) {
        this.logger.info('[executeProcess] Invalid Amount: ' + usdAmount);
        return this.buildErrorResponse(
          CardsEnum.CARD_PROCESS_INVALID_AMOUNT,
          authorize,
        );
      }

      const isOperationHasCommissions = this.isOperationHasCommissions(process);
      const isOperationInternational =
        process.transaction.origin === CommisionTypeEnum.INTERNATIONAL;

      const percentageCommisions = isOperationHasCommissions
        ? isOperationInternational
          ? percentageCommisionNational + percentageCommisionInternational
          : percentageCommisionNational
        : 0;

      const processResult = await this.builder.getPromiseAccountEventClient(
        EventsNamesAccountEnum.pomeloTransaction,
        {
          id: cardId,
          amount: usdAmount,
          movement,
          authorize,
          commision: percentageCommisions,
        },
      );
      return this.buildProcessResponse(processResult, authorize);
    } catch (error) {
      this.logger.error(
        `[executeProcess] PomeloProcess ${error.message || error}`,
      );
      throw new InternalServerErrorException(error);
    }
  }

  private buildProcessResponse(result: CardsEnum, authorize: boolean): any {
    if (authorize) {
      if (result === CardsEnum.CARD_PROCESS_OK) {
        return {
          status: CardsEnum.CARD_PROCESS_OK,
          message: `Transaction approved.`,
          status_detail: CardsEnum.CARD_PROCESS_OK,
          statusCode: HttpStatus.OK,
        };
      } else if (result === CardsEnum.CARD_PROCESS_TRANSACTION_EXISTS) {
        return {
          status: CardsEnum.CARD_PROCESS_OK,
          message: `Transaction approved.`,
          status_detail: CardsEnum.CARD_PROCESS_TRANSACTION_EXISTS,
          statusCode: HttpStatus.OK,
        };
      }
    } else if (result === CardsEnum.CARD_PROCESS_OK) {
      return {
        statusCode: HttpStatus.NO_CONTENT,
        body: {},
      };
    }
    return this.buildErrorResponse(result, authorize);
  }

  private buildErrorResponse(result: CardsEnum, authorize: boolean): any {
    let response = {};
    if (result === CardsEnum.CARD_PROCESS_INVALID_AMOUNT) {
      response = {
        status: CardsEnum.CARD_PROCESS_REJECTED,
        message: `Transaction rejected.`,
        status_detail: CardsEnum.CARD_PROCESS_INVALID_AMOUNT,
      };
    } else if (result === CardsEnum.CARD_PROCESS_FAILURE) {
      response = {
        status: CardsEnum.CARD_PROCESS_REJECTED,
        message: `Transaction rejected.`,
        status_detail: CardsEnum.CARD_PROCESS_SYSTEM_ERROR,
      };
    } else if (result === CardsEnum.CARD_PROCESS_CARD_NOT_FOUND) {
      response = {
        status: CardsEnum.CARD_PROCESS_REJECTED,
        message: `Transaction rejected.`,
        status_detail: CardsEnum.CARD_PROCESS_CARD_NOT_FOUND,
      };
    } else if (result === CardsEnum.CARD_PROCESS_INSUFFICIENT_FUNDS) {
      response = {
        status: CardsEnum.CARD_PROCESS_REJECTED,
        message: `Transaction rejected.`,
        status_detail: CardsEnum.CARD_PROCESS_INSUFFICIENT_FUNDS,
      };
    } else if (result === CardsEnum.CARD_PROCESS_INVALID_INSTALLMENTS) {
      response = {
        status: CardsEnum.CARD_PROCESS_REJECTED,
        message: `Transaction rejected.`,
        status_detail: CardsEnum.CARD_PROCESS_INVALID_INSTALLMENTS,
      };
    } else if (result === CardsEnum.CARD_PROCESS_CARD_LOCKED) {
      response = {
        status: CardsEnum.CARD_PROCESS_REJECTED,
        message: `Transaction rejected.`,
        status_detail: CardsEnum.CARD_PROCESS_CARD_LOCKED,
      };
    }

    if (!authorize) {
      // If it is processing an adjustment it must respond with a different status code.
      throw new InternalServerErrorException(result);
    }
    return response;
  }

  async processNotification(
    notification: NotificationDto,
    headers: any,
  ): Promise<any> {
    this.logger.info(
      `[ProcessNotification] Message Received ${JSON.stringify(notification)}`,
    );
    let cachedResult = await this.cache.getResponse(
      notification.idempotency_key,
    );
    if (cachedResult == null) {
      cachedResult = await this.cache.setTooEarly(notification.idempotency_key);

      const amount = {
        to: notification?.event_detail?.amount?.settlement?.currency,
        from: notification?.event_detail?.amount?.local?.currency,
        amount: notification?.event_detail?.amount?.local?.total,
        usd: notification?.event_detail?.amount?.settlement?.total,
      };

      cachedResult = await this.cache.setResponseReceived(
        notification.idempotency_key,
      );
      await this.createTransferRecord(
        notification?.event_detail,
        headers,
        cachedResult,
        amount,
      );
      return cachedResult;
    }
    return cachedResult;
  }
  async processAdjustment(adjustment: Adjustment, headers: any): Promise<any> {
    try {
      const processed = await this.process(
        adjustment,
        adjustment.idempotency,
        false,
        headers,
      );

      this.sendAdjustmentNotificationEmail(adjustment).catch((error) => {
        this.logger.error(
          `[ProcessNotification] Error sending adjustment notification email ${
            error.message || error
          }`,
        );
      });

      return processed;
    } catch (error) {
      this.logger.error(
        `[ProcessNotification] Error processing adjustment ${
          error.message || error
        }`,
      );
    }
  }

  private async sendAdjustmentNotificationEmail(
    adjustment: Adjustment,
  ): Promise<void> {
    if (adjustment.user && adjustment.user.id) {
      const data = {
        vars: {
          cardId: adjustment.card.id,
          transactionType: adjustment.transaction?.type,
          merchantName: adjustment.merchant?.name,
          cardLastFour: adjustment.card?.last_four,
          amountLocal: adjustment.amount?.settlement?.total,
          currencyLocal: adjustment.amount?.settlement?.currency,
        },
      };

      this.logger.info(
        `[sendAdjustmentNotificationEmail] Purchases/Transaction Adjustments Email Prepared ${JSON.stringify(
          data,
        )}`,
      );
      this.builder.emitMessageEventClient(
        EventsNamesMessageEnum.sendAdjustments,
        data,
      );
    } else {
      this.logger.warn(
        `[sendAdjustmentNotificationEmail] Adjustment processed without valid user ID. Skipping notification email.`,
      );
    }
  }

  async processAuthorization(
    authorization: Authorization,
    headers: any,
  ): Promise<any> {
    const process = await this.process(
      authorization,
      authorization.idempotency,
      true,
      headers,
    );

    const data = {
      transport: TransportEnum.EMAIL,
      vars: {
        cardId: authorization.card.id,
        transactionDate: new Date().toLocaleString('es-ES', {
          timeZone: 'America/Bogota',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        customerName: '',
        transactionStatus: process.status,
        transactionType: authorization.transaction?.type,
        merchantName: authorization.merchant?.name,
        cardLastFour: authorization.card?.last_four,
        amountLocal: authorization.amount?.local?.total,
        currencyLocal: authorization.amount?.local?.currency,
      },
    };

    this.builder.emitMessageEventClient(
      EventsNamesMessageEnum.sendPurchases,
      data,
    );

    return process;
  }
}
