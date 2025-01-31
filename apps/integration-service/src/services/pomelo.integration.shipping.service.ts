import { Traceable } from '@amplication/opentelemetry-nestjs';
import {
  CardEvents,
  ShippingNotifications,
} from '@integration/integration/dto/pomelo.shipping.body.dto';
import { PomeloCache } from '@integration/integration/util/pomelo.integration.process.cache';
import { Injectable, Logger } from '@nestjs/common';

@Traceable()
@Injectable()
export class PomeloIntegrationShippingService {
  constructor(private readonly cache: PomeloCache) {}

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
      Logger.debug(notification, 'Shipping-NotificationHandler');
      Logger.debug(
        JSON.stringify(notification, null, 2),
        'Shipping-NotificationHandler',
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
      Logger.debug(
        JSON.stringify(event, null, 2),
        'CardEvents-NotificationHandler',
      );
      await this.cache.setResponse(event.idempotency_key, response);
      return response;
    }
    return cachedResult;
  }
}
