import {
  CardEvents,
  ShippingNotifications,
} from '@integration/integration/dto/pomelo.shipping.body.dto';
import { PomeloCache } from '@integration/integration/util/pomelo.integration.process.cache';
import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

import { Traceable } from '@amplication/opentelemetry-nestjs';

@Traceable()
@Injectable()
export class PomeloIntegrationShippingService {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    private readonly cache: PomeloCache,
  ) {}

  async handleShippingNotification(
    notification: ShippingNotifications,
  ): Promise<any> {
    const cachedResult = await this.cache.getResponse(
      notification.idempotency_key,
    );
    if (cachedResult == null) {
      const response = {
        statusCode: 204,
        body: {},
      };
      this.logger.debug('Shipping-NotificationHandler', notification);
      this.logger.debug(
        'Shipping-NotificationHandler',
        JSON.stringify(notification, null, 2),
      );
      await this.cache.setResponse(notification.idempotency_key, response);
      return response;
    }
    return cachedResult;
  }

  async handleCardEvents(event: CardEvents): Promise<any> {
    const cachedResult = await this.cache.getResponse(event.idempotency_key);
    if (cachedResult == null) {
      const response = {
        statusCode: 204,
        body: {},
      };
      this.logger.debug(
        'CardEvents-NotificationHandler',
        JSON.stringify(event, null, 2),
      );
      await this.cache.setResponse(event.idempotency_key, response);
      return response;
    }
    return cachedResult;
  }
}
