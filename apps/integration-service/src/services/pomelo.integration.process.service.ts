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
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Transfer } from '@transfer/transfer/entities/mongoose/transfer.schema';
import { OperationTransactionType } from '@transfer/transfer/enum/operation.transaction.type.enum';
import EventsNamesAccountEnum from 'apps/account-service/src/enum/events.names.account.enum';
import EventsNamesMessageEnum from 'apps/message-service/src/enum/events.names.message.enum';
import EventsNamesTransferEnum from 'apps/transfer-service/src/enum/events.names.transfer.enum';
import { mongo } from 'mongoose';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { FiatIntegrationClient } from '../clients/fiat.integration.client';
import { PomeloProcessEnum } from '../enums/pomelo.process.enum';
import {
  CommissionsTypeDescriptionMap,
  CommissionsTypePreviousMap,
} from '../maps/commisions-type.map';

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
  ) { }

  private async process(
    process: any,
    idempotency: string,
    authorize: boolean,
    headers: any,
  ): Promise<any> {
    let response;
    response = await this.cache.getResponse(idempotency);
    if (response == null) {
      response = await this.cache.setTooEarly(idempotency);
      const amount = await this.getAmount(process);
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

  private async createTransferRecord(
    process: any,
    headers: any,
    response: any,
    amount: any,
    authorize?: boolean,
  ) {
    try {
      const commisionNational = parseFloat(
        this.configService.getOrThrow('COMMISION_NATIONAL'),
      );
      const commisionInternational = parseFloat(
        this.configService.getOrThrow('COMMISION_INTERNATIONAL'),
      );
      const transactionId = new mongo.ObjectId();
      const commisionNationalTransactionId = new mongo.ObjectId();
      const commisionInternationalTransactionId = new mongo.ObjectId();
      const pretransaction = {
        _id: transactionId,
        parentTransaction: null,
        integration: 'Pomelo',
        requestBodyJson: process,
        requestHeadersJson: headers,
        operationType:
          OperationTransactionType[process?.transaction?.type?.toLowerCase()],
        status: response?.status ?? CardsEnum.CARD_PROCESS_OK,
        descriptionStatusPayment:
          response?.status_detail ?? CardsEnum.CARD_PROCESS_OK,
        description: response?.message ?? '',
        amount: amount.amount,
        amountCustodial: amount.usd,
        currency: amount.from === 'USD' ? 'USDT' : amount.from,
        currencyCustodial: amount.to === 'USD' ? 'USDT' : amount.to,
        showToOwner: true,
        isApprove: response?.status === CardsEnum.CARD_PROCESS_OK,
        commisions:
          process.transaction.origin === CommisionTypeEnum.INTERNATIONAL
            ? [
              commisionNationalTransactionId,
              commisionInternationalTransactionId,
            ]
            : [commisionNationalTransactionId],
      };

      const isTransactionReversalPurchase =
        pretransaction.operationType ===
        OperationTransactionType.reversal_purchase;
      const isTransactionRefund =
        pretransaction.operationType === OperationTransactionType.refund;
      const isTransactionReversalRefund =
        pretransaction.operationType ===
        OperationTransactionType.reversal_refund;

      const operationTypeParent = CommissionsTypePreviousMap.get(
        pretransaction.operationType,
      );

      const [parentTransaction] =
        isTransactionReversalPurchase ||
          isTransactionRefund ||
          isTransactionReversalRefund
          ? (
            await this.builder.getPromiseTransferEventClient<{
              list: Transfer[];
            }>(EventsNamesTransferEnum.findAll, {
              where: {
                'requestBodyJson.transaction.id':
                  process?.transaction?.original_transaction_id,
                operationType: operationTypeParent,
                leadCrmName: { $ne: 'Sales' },
              },
            })
          ).list
          : [];

      const parentCommisions = parentTransaction
        ? (
          await this.builder.getPromiseTransferEventClient<{
            list: Transfer[];
          }>(EventsNamesTransferEnum.findAll, {
            where: { _id: { $in: parentTransaction?.commisions ?? [] } },
          })
        ).list
        : [];

      const parentCommisionNational = parentCommisions.find(
        (tx) => tx.commisionType === CommisionTypeEnum.NATIONAL,
      );

      const parentCommisionInternational = parentCommisions.find(
        (tx) => tx.commisionType === CommisionTypeEnum.INTERNATIONAL,
      );

      const commisionNationalDetail = {
        _id: commisionNationalTransactionId,
        amount:
          isTransactionReversalPurchase ||
            isTransactionRefund ||
            isTransactionReversalRefund
            ? parentCommisionNational?.amount
            : amount.amount * commisionNational,
        amountCustodial:
          isTransactionReversalPurchase ||
            isTransactionRefund ||
            isTransactionReversalRefund
            ? parentCommisionNational?.amountCustodial
            : amount.usd * commisionNational,
        currency:
          isTransactionReversalPurchase ||
            isTransactionRefund ||
            isTransactionReversalRefund
            ? parentCommisionNational?.currency
            : amount.from === 'USD'
              ? 'USDT'
              : amount.from,
        currencyCustodial:
          isTransactionReversalPurchase ||
            isTransactionRefund ||
            isTransactionReversalRefund
            ? parentCommisionNational?.currencyCustodial
            : amount.to === 'USD'
              ? 'USDT'
              : amount.to,
        commisionType: CommisionTypeEnum.NATIONAL,
      };

      const commisionInternationalDetail = {
        _id: commisionInternationalTransactionId,
        amount:
          isTransactionReversalPurchase ||
            isTransactionRefund ||
            isTransactionReversalRefund
            ? parentCommisionInternational?.amount
            : amount.amount * commisionInternational,
        amountCustodial:
          isTransactionReversalPurchase ||
            isTransactionRefund ||
            isTransactionReversalRefund
            ? parentCommisionInternational?.amountCustodial
            : amount.usd * commisionInternational,
        currency:
          isTransactionReversalPurchase ||
            isTransactionRefund ||
            isTransactionReversalRefund
            ? parentCommisionInternational?.currency
            : amount.from === 'USD'
              ? 'USDT'
              : amount.from,
        currencyCustodial:
          isTransactionReversalPurchase ||
            isTransactionRefund ||
            isTransactionReversalRefund
            ? parentCommisionInternational?.currencyCustodial
            : amount.to === 'USD'
              ? 'USDT'
              : amount.to,
        commisionType: CommisionTypeEnum.INTERNATIONAL,
      };

      const transaction = parentTransaction
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
          amount: parentTransaction?.amount ?? pretransaction.amount,
          currency: parentTransaction?.currency ?? pretransaction.currency,
          amountCustodial:
            parentTransaction?.amountCustodial ??
            pretransaction.amountCustodial,
          currencyCustodial:
            parentTransaction?.currencyCustodial ??
            pretransaction.currencyCustodial,
          amountComissions:
            process.transaction.origin === CommisionTypeEnum.INTERNATIONAL
              ? commisionNationalDetail.amountCustodial +
              commisionInternationalDetail.amountCustodial
              : commisionNationalDetail.amountCustodial,
          commisionsDetails:
            process.transaction.origin === CommisionTypeEnum.INTERNATIONAL
              ? [commisionNationalDetail, commisionInternationalDetail]
              : [commisionNationalDetail],
        }
        : {
          ...pretransaction,
          commisionsDetails:
            process.transaction.origin === CommisionTypeEnum.INTERNATIONAL
              ? [commisionNationalDetail, commisionInternationalDetail]
              : [commisionNationalDetail],
        };

      this.builder.emitTransferEventClient(
        EventsNamesTransferEnum.createOneWebhook,
        transaction,
      );

      const amountUSD = amount.usd ?? amount.amount;

      if (authorize && amountUSD * commisionNational > 0) {
        this.logger.info(
          `[createTransferRecord] Commision to B2Fintech National: ${amountUSD * commisionNational
          }`,
        );

        this.builder.emitTransferEventClient(
          EventsNamesTransferEnum.createOneWebhook,
          {
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
            showToOwner: true,
            commisionsDetails: [],
            isApprove: response?.status === CardsEnum.CARD_PROCESS_OK,
            // isManualTx: true,
          },
        );
      }

      if (
        authorize &&
        amountUSD * commisionInternational > 0 &&
        process.transaction.origin === CommisionTypeEnum.INTERNATIONAL
      ) {
        this.logger.info(
          `[createTransferRecord] Commision to B2Fintech International: ${amountUSD * commisionInternational
          }`,
        );

        this.builder.emitTransferEventClient(
          EventsNamesTransferEnum.createOneWebhook,
          {
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
            showToOwner: true,
            commisionsDetails: [commisionNationalDetail],
            isApprove: response?.status === CardsEnum.CARD_PROCESS_OK,
            // isManualTx: true,
          },
        );
      }
    } catch (error) {
      this.logger.info(
        `[createTransferRecord] Error creating transfer: ${error.message || error
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
      const commisionNational = parseFloat(
        this.configService.getOrThrow('COMMISION_NATIONAL'),
      );
      const commisionInternational = parseFloat(
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
      const processResult = await this.builder.getPromiseAccountEventClient(
        EventsNamesAccountEnum.pomeloTransaction,
        {
          id: cardId,
          amount: usdAmount,
          movement,
          authorize,
          commision:
            commisionNational +
            (process.transaction.origin === CommisionTypeEnum.INTERNATIONAL
              ? commisionInternational
              : 0),
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
        };
      }
    } else if (result === CardsEnum.CARD_PROCESS_OK) {
      return {
        statusCode: 204,
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
          `[ProcessNotification] Error sending adjustment notification email ${error.message || error
          }`,
        );
      });

      return processed;
    } catch (error) {
      this.logger.error(
        `[ProcessNotification] Error processing adjustment ${error.message || error
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

    let transactionDate = '';
    let transactionTime = '';

    if (authorization.transaction?.local_date_time) {
      const txnDate = new Date(authorization.transaction.local_date_time);

      transactionDate = txnDate.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

      transactionTime = txnDate.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }) + 'h';
    } else {
      const now = new Date();
      transactionDate = now.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
      transactionTime = now.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }) + 'h';
    }

    let amountFormatted = '';
    let currencyCode = '';

    if (authorization.amount?.local?.total && authorization.amount?.local?.currency) {
      currencyCode = authorization.amount.local.currency;
      const totalAmount = parseFloat(authorization.amount.local.total);
      amountFormatted = new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: currencyCode
      }).format(totalAmount);
    }
    const data = {
      transport: TransportEnum.EMAIL,
      vars: {
        cardId: authorization.card?.id || '',
        name: '',
        transactionDate: transactionDate,
        transactionTime: transactionTime,
        transactionStatus: process.status,
        transactionType: authorization.transaction?.type || '',
        merchant: authorization.merchant?.name || '',
        lastFourDigits: authorization.card?.last_four || '',
        amountReload: amountFormatted,
        currency: currencyCode,
      },
    };

    if (process.status === 'REJECTED') {
      (data.vars as any).rejectionReason = process.status_detail || process.message;

      this.builder.emitMessageEventClient(
        EventsNamesMessageEnum.sendPurchaseRejected,
        data,
      );

      console.log(`Correo de notificación de rechazo enviado para transacción ${authorization.idempotency}`);
    }

    this.builder.emitMessageEventClient(
      EventsNamesMessageEnum.sendPurchases,
      data,
    );

    return process;
  }
}

