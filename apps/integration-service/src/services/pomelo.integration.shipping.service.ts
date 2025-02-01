import { Traceable } from '@amplication/opentelemetry-nestjs';
import {
  CardEvents,
  ShippingNotifications,
} from '@integration/integration/dto/pomelo.shipping.body.dto';
import { PomeloCache } from '@integration/integration/util/pomelo.integration.process.cache';
import { Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Traceable()
@Injectable()
export class PomeloIntegrationShippingService {
  constructor(
    @InjectPinoLogger(PomeloIntegrationShippingService.name)
    protected readonly logger: PinoLogger,
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
      this.logger.debug(
        JSON.stringify(event, null, 2),
        'CardEvents-NotificationHandler',
      );
      await this.cache.setResponse(event.idempotency_key, response);
      return response;
    }
    return cachedResult;
  }
}
