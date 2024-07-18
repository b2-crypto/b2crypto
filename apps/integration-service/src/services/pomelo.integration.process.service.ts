import { Injectable, Logger } from '@nestjs/common';
import {
  AdjustmentDto,
  AuthorizationDto,
  NotificationDto,
} from '../dto/pomelo.process.body.dto';
import { PomeloCache } from '../clients/pomelo.integration.process.cache';
import { FiatIntegrationClient } from '../clients/pomelo.fiat.integration.client';
import { BuildersService } from '@builder/builders';
import EventsNamesAccountEnum from 'apps/account-service/src/enum/events.names.account.enum';

@Injectable()
export class PomeloIntegrationService {
  constructor(
    private readonly chache: PomeloCache,
    private readonly currencyConversion: FiatIntegrationClient,
    private readonly builder: BuildersService,
  ) {}

  private async processDebit(process: any, type: string) {
    const amountInUSD = await this.currencyConversion.getCurrencyConversion(
      process,
    );

    if (type == this.TYPE_OF_OPERATION.AUTHORIZATION.toString()) {
      return await this.processPurchase(process, amountInUSD);
    } else {
      return await this.processAdjustmentMovement(
        process,
        amountInUSD,
        'debit',
      );
    }
  }

  private async processCredit(process: any, type: string) {
    try {
      const amountInUSD = await this.currencyConversion.getCurrencyConversion(
        process,
      );
      await this.processAdjustmentMovement(process, amountInUSD, 'credit');
      if (type == this.TYPE_OF_OPERATION.AUTHORIZATION.toString()) {
        return {
          statusCode: 200,
          body: {
            status: 'APPROVED',
            message: `Transaction ${process.transaction.id} has been approved`,
            status_detail: 'APPROVED',
          },
        };
      } else {
        return {
          statusCode: 204,
          body: {},
        };
      }
    } catch (error) {}
  }

  private async processAdjustmentMovement(
    process: any,
    amountInUSD: number,
    movement: string,
  ) {
    try {
      await this.builder.getPromiseAccountEventClient(
        EventsNamesAccountEnum.updateAmount,
        {
          id: process?.card?.id || '',
          amount: amountInUSD,
          movement: movement,
        },
      );
      return {
        statusCode: 204,
        body: {},
      };
    } catch (error) {}
  }

  private async processPurchase(process: any, amountInUSD: number) {
    try {
      await this.builder.getPromiseAccountEventClient(
        EventsNamesAccountEnum.athorizationTx,
        {
          id: process?.card?.id || '',
          amount: amountInUSD,
        },
      );
      return {
        statusCode: 200,
        body: {
          status: 'APPROVED',
          message: `Transaction ${process.transaction.id} has been approved`,
          status_detail: 'APPROVED',
        },
      };
    } catch (error) {
      return {
        statusCode: 200,
        body: {
          status: 'REJECTED',
          message: `Transaction ${process.transaction.id} has been rejected: ${error}`,
          status_detail: 'INSUFFICIENT_FUNDS',
        },
      };
    }
  }

  private async process(
    process: any,
    type: string,
    idempotency: string,
  ): Promise<any> {
    let cachedResult = await this.chache.getResponse(idempotency);
    if (cachedResult == null) {
      cachedResult = await this.chache.setTooEarly(idempotency);
      // Save notification record.

      const response = await this.OPERATION[process.transaction.type](
        process,
        type,
      );
      await this.chache.setResponse(idempotency, response);
      return response;
    }
  }

  private TYPE_OF_OPERATION = {
    AUTHORIZATION: 0,
    ADJUSTMENT: 1,
  };

  private TYPE_OF_ADJUSTMENT = {
    PAYMENT: this.processDebit,
    REFUND: this.processCredit,
    UNDEFINED: undefined,
  };

  OPERATION = {
    ['PURCHASE']: this.TYPE_OF_ADJUSTMENT.PAYMENT,
    ['WITHDRAWAL']: this.TYPE_OF_ADJUSTMENT.PAYMENT,
    ['EXTRACASH']: this.TYPE_OF_ADJUSTMENT.PAYMENT,
    ['BALANCE_INQUIRY']: this.TYPE_OF_ADJUSTMENT.UNDEFINED,
    ['REFUND']: this.TYPE_OF_ADJUSTMENT.REFUND,
    ['PAYMENT']: this.TYPE_OF_ADJUSTMENT.PAYMENT,
    ['REVERSAL_PURCHASE']: this.TYPE_OF_ADJUSTMENT.REFUND,
    ['REVERSAL_WITHDRAWAL']: this.TYPE_OF_ADJUSTMENT.REFUND,
    ['REVERSAL_EXTRACASH']: this.TYPE_OF_ADJUSTMENT.REFUND,
    ['REVERSAL_REFUND']: this.TYPE_OF_ADJUSTMENT.PAYMENT,
    ['REVERSAL_PAYMENT']: this.TYPE_OF_ADJUSTMENT.REFUND,
  };

  async processNotification(notification: NotificationDto): Promise<any> {
    Logger.log('ProcessNotification', 'Message Received');
    let cachedResult = await this.chache.getResponse(
      notification.idempotency_key,
    );
    if (cachedResult == null) {
      cachedResult = await this.chache.setTooEarly(
        notification.idempotency_key,
      );
      // Save notification record.

      cachedResult = await this.chache.setResponseReceived(
        notification.idempotency_key,
      );
      return cachedResult;
    }
    return cachedResult;
  }

  async processAdjustment(adjustment: AdjustmentDto): Promise<any> {
    return await this.process(
      adjustment.body,
      this.TYPE_OF_OPERATION.ADJUSTMENT.toString(),
      adjustment.idempotency,
    );
  }

  async processAuthorization(authorization: AuthorizationDto): Promise<any> {
    return await this.process(
      authorization.body,
      this.TYPE_OF_OPERATION.ADJUSTMENT.toString(),
      authorization.idempotency,
    );
  }
}
