import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { FiatIntegrationClient } from '../clients/fiat.integration.client';
import { BuildersService } from '@builder/builders';
import EventsNamesAccountEnum from 'apps/account-service/src/enum/events.names.account.enum';
import {
  Adjustment,
  Authorization,
  NotificationDto,
} from '@integration/integration/dto/pomelo.process.body.dto';
import { PomeloCache } from '@integration/integration/util/pomelo.integration.process.cache';
import { PomeloProcessEnum } from '../enums/pomelo.process.enum';
import { CardsEnum } from '@common/common/enums/messages.enum';
import EventsNamesTransferEnum from 'apps/transfer-service/src/enum/events.names.transfer.enum';
import { OperationTransactionType } from '@transfer/transfer/enum/operation.transaction.type.enum';
import EventsNamesMessageEnum from 'apps/message-service/src/enum/events.names.message.enum';
import TransportEnum from '@common/common/enums/TransportEnum';

@Injectable()
export class PomeloIntegrationProcessService {
  constructor(
    private readonly cache: PomeloCache,
    private readonly currencyConversion: FiatIntegrationClient,
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
    try {
      const to = process.env.DEFAULT_CURRENCY_CONVERSION_COIN;
      const from = txn.amount.local.currency;
      const amount = txn.amount.local.total;
      const usd = await this.currencyConversion.getCurrencyConversion(
        to,
        from,
        amount,
      );
      return {
        to,
        from,
        amount,
        usd,
      };
    } catch (error) {
      Logger.error(error, 'PomeloProcess');
      throw new InternalServerErrorException(error);
    }
  }

  private async executeProcess(
    process: any,
    authorize: boolean,
    usdAmount: number,
  ): Promise<any> {
    try {
      const cardId = process?.card?.id || '';
      const movement = PomeloProcessEnum[process?.transaction?.type];
      if (usdAmount <= 0) {
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
      Logger.error(error, 'PomeloProcess');
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
    const time = new Date();
    Logger.log(
      'ProcessNotification',
      `${time.toISOString()} - Message Received`,
    );
    let cachedResult = await this.cache.getResponse(
      notification.idempotency_key,
    );
    if (cachedResult == null) {
      Logger.log('No cached response', `Message Received`);
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
    }
    Logger.debug(
      cachedResult,
      `${time.toISOString()} - Cache result`,
      `(${new Date().getTime() - time.getTime()}ms) Cache result`,
    );
    Logger.debug(`${new Date().getTime() - time.getTime()}ms`, `Time total`);
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

      setImmediate(() => {
        this.sendAdjustmentNotificationEmail(adjustment).catch((error) => {
          Logger.error(
            'Error sending adjustment notification email',
            error.stack,
          );
        });
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
        name: `Notificacion de Ajuste de Transaccion`, // Revisar metodos ASCCII
        body: `Se ha realizado un ajuste en una de tus transacciones`, // Revisar creacion de un ENUM como solición temporal
        originText: 'Sistema',
        destinyText: adjustment.user.id,
        transport: TransportEnum.EMAIL,
        destiny: null,
        vars: {
          userId: adjustment.user.id,
          transactionId: adjustment.transaction?.id,
          transactionType: adjustment.transaction?.type,
          transactionDate: adjustment.transaction?.local_date_time,
          merchantName: adjustment.merchant?.name,
          merchantMcc: adjustment.merchant?.mcc,
          cardLastFour: adjustment.card?.last_four,
          cardProductType: adjustment.card?.product_type,
          amountLocal: adjustment.amount?.settlement?.total,
          currencyLocal: adjustment.amount?.settlement?.currency,
        },
      };

      if (adjustment.transaction?.id) {
        data.destiny = {
          resourceId: adjustment.transaction.id,
          resourceName: 'TRANSACTION',
        };
      }

      Logger.log(data, 'Purchases/Transaction Adjustments Email Prepared');
      this.builder.emitMessageEventClient(
        EventsNamesMessageEnum.sendPurchasesTransactionAdjustments,
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
    return await this.process(
      authorization,
      authorization.idempotency,
      true,
      headers,
    );
  }
}
