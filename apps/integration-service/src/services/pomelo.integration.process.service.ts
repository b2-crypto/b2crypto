import { Injectable, Logger } from '@nestjs/common';
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
  ): Promise<any> {
    let response;
    try {
      response = await this.cache.getResponse(idempotency);
      if (response == null) {
        response = await this.cache.setTooEarly(idempotency);
        response = await this.executeProcess(process, authorize);
        await this.cache.setResponse(idempotency, response);
      }
    } catch (error) {
      Logger.error(error, 'PomeloProcess');
    }
    return response;
  }

  private async executeProcess(process: any, authorize: boolean): Promise<any> {
    try {
      const amountInUSD = await this.currencyConversion.getCurrencyConversion(
        process,
      );
      const cardId = process?.card?.id || '';
      const movement = PomeloProcessEnum[process?.transaction?.type];
      if (amountInUSD <= 0) {
        return CardsEnum.CARD_PROCESS_INVALID_AMOUNT;
      }
      const processResult = await this.builder.getPromiseAccountEventClient(
        EventsNamesAccountEnum.pomeloTransaction,
        {
          id: cardId,
          amount: amountInUSD,
          movement,
          authorize,
        },
      );
    } catch (error) {
      Logger.error(error, 'PomeloProcess');
      return CardsEnum.CARD_PROCESS_FAILURE;
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
    } else {
      return this.buildErrorResponse(result, authorize);
    }
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
      response['statusCode'] = 500;
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

  async processAdjustment(adjustment: Adjustment): Promise<any> {
    return await this.process(adjustment, adjustment.idempotency, false);
  }

  async processAuthorization(authorization: Authorization): Promise<any> {
    return await this.process(authorization, authorization.idempotency, true);
  }
}
