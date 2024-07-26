import {
  CardEvents,
  ShippingNotifications,
} from '@integration/integration/dto/pomelo.shipping.body.dto';
import { PomeloCache } from '@integration/integration/util/pomelo.integration.process.cache';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PomeloIntegrationShippingService {
  constructor(private readonly cache: PomeloCache) {}

  async handleShippingNotification(
    notification: ShippingNotifications,
  ): Promise<any> {
    let cachedResult = await this.cache.getResponse(
      notification.idempotency_key,
    );
    if (cachedResult == null) {
      const response = {
        statusCode: 204,
        body: {},
      };
      await this.cache.setResponse(notification.idempotency_key, response);
      return response;
    }
    return cachedResult;
  }

  async handleCardEvents(event: CardEvents): Promise<any> {
    let cachedResult = await this.cache.getResponse(event.idempotency_key);
    if (cachedResult == null) {
      const response = {
        statusCode: 204,
        body: {},
      };
      await this.cache.setResponse(event.idempotency_key, response);
      return response;
    }
    return cachedResult;
  }
}
