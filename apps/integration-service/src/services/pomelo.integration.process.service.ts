import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { FiatIntegrationClient } from '../clients/fiat.integration.client';
import { BuildersService } from '@builder/builders';
import EventsNamesAccountEnum from '../../../../apps/account-service/src/enum/events.names.account.enum';
import {
  Adjustment,
  Authorization,
  NotificationDto,
} from '@integration/integration/dto/pomelo.process.body.dto';
import { PomeloCache } from '@integration/integration/util/pomelo.integration.process.cache';
import { PomeloProcessEnum } from '../enums/pomelo.process.enum';
import { CardsEnum } from '@common/common/enums/messages.enum';
import EventsNamesTransferEnum from '../../../../apps/transfer-service/src/enum/events.names.transfer.enum';
import { OperationTransactionType } from '@transfer/transfer/enum/operation.transaction.type.enum';
import EventsNamesMessageEnum from '../../../../apps/message-service/src/enum/events.names.message.enum';
import TransportEnum from '@common/common/enums/TransportEnum';

@Injectable()
export class PomeloIntegrationProcessService {
  constructor(
    private readonly cache: PomeloCache,
    private readonly currencyConversion: FiatIntegrationClient,
    @Inject(BuildersService)
    private readonly builder: BuildersService,
  ) {}

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
      this.createTransferRecord(process, headers, response, amount);
    }
    return response;
  }

  private createTransferRecord(
    process: any,
    headers: any,
    response: any,
    amount: any,
  ) {
    try {
      this.builder.emitTransferEventClient(
        EventsNamesTransferEnum.createOneWebhook,
        {
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
          currency: amount.from,
          currencyCustodial: amount.to,
        },
      );
    } catch (error) {
      Logger.log(
        `Error creatin transfer: ${error}`,
        PomeloIntegrationProcessService.name,
      );
    }
  }

  private async getAmount(txn: any): Promise<any> {
    let conversion: string;
    try {
      const to = process.env.DEFAULT_CURRENCY_CONVERSION_COIN;
      const from = txn.amount.local.currency;
      const amount = txn.amount.local.total;
      conversion = `to: ${to} | from: ${from} | amount: ${amount}`;
      let usd = 0;
      if (parseInt(amount) > 0) {
        usd = await this.currencyConversion.getCurrencyConversion(
          to,
          from,
          amount,
        );
      }
      return {
        to,
        from,
        amount,
        usd,
      };
    } catch (error) {
      Logger.error(
        `Error: ${error} | Request: ${conversion}`,
        'PomeloProcess getAmount',
      );
      throw new InternalServerErrorException(error);
    }
  }

  private async executeProcess(
    process: any,
    authorize: boolean,
    usdAmount: number,
  ): Promise<any> {
    try {
      Logger.log('JSON.stringify(process)', 'ExecuteProcess start');
      /* if (
        process?.installments &&
        parseInt(process?.installments?.quantity) > 1
      ) {
        Logger.log(
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
        Logger.log('Invalid Amount: ' + usdAmount, 'ExecuteProcess');
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
        },
      );
      return this.buildProcessResponse(processResult, authorize);
    } catch (error) {
      Logger.error(error, 'PomeloProcess executeProcess');
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
        status_detail: CardsEnum.CARD_PROCESS_OTHER,
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
        status_detail: CardsEnum.CARD_PROCESS_OTHER,
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
    Logger.log('ProcessNotification', 'Message Received');
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
      this.createTransferRecord(
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
        Logger.error(
          'Error sending adjustment notification email',
          error.stack,
        );
      });

      return processed;
    } catch (error) {
      Logger.error('Error processing adjustment', error.stack);
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

      Logger.log(data, 'Purchases/Transaction Adjustments Email Prepared');
      this.builder.emitMessageEventClient(
        EventsNamesMessageEnum.sendAdjustments,
        data,
      );
    } else {
      Logger.warn(
        'Adjustment processed without valid user ID. Skipping notification email.',
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
