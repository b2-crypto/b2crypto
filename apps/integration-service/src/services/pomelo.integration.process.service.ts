import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { FiatIntegrationClient } from '../clients/pomelo.fiat.integration.client';
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
    this.builder.emitTransferEventClient(
      EventsNamesTransferEnum.createOneWebhok,
      {
        integration: 'Pomelo',
        requestBodyJson: process,
        requestHeadersJson: headers,
        operationType: OperationTransactionType[process?.transaction?.type],
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
  }

  private async getAmount(txn: any): Promise<any> {
    try {
      const to = process.env.DEFAULT_CURRENCY_TO_CONVERT;
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
          message: `Transaction rejected.`,
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

  async processNotification(notification: NotificationDto): Promise<any> {
    Logger.log('ProcessNotification', 'Message Received');
    let cachedResult = await this.cache.getResponse(
      notification.idempotency_key,
    );
    if (cachedResult == null) {
      cachedResult = await this.cache.setTooEarly(notification.idempotency_key);

      // Save notification record on activity

      cachedResult = await this.cache.setResponseReceived(
        notification.idempotency_key,
      );
      return cachedResult;
    }
    return cachedResult;
  }

  async processAdjustment(adjustment: Adjustment, headers: any): Promise<any> {
    return await this.process(
      adjustment,
      adjustment.idempotency,
      false,
      headers,
    );
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
