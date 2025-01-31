import { Traceable } from '@amplication/opentelemetry-nestjs';
import { PomeloSignatureGuard } from '@auth/auth/guards/pomelo.signature.guard';
import { PomeloSignatureInterceptor } from '@common/common/interceptors/pomelo.signature.interceptor';
import {
  CardEvents,
  ShippingNotifications,
} from '@integration/integration/dto/pomelo.shipping.body.dto';
import { PomeloEnum } from '@integration/integration/enum/pomelo.enum';
import {
  Body,
  Controller,
  HttpCode,
  Logger,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PomeloIntegrationShippingService } from './services/pomelo.integration.shipping.service';

@Traceable()
@Controller()
@UseGuards(PomeloSignatureGuard)
@UseInterceptors(PomeloSignatureInterceptor)
export class PomeloShippingController {
  constructor(
    private readonly shippingService: PomeloIntegrationShippingService,
  ) {}

  @Post(PomeloEnum.POMELO_SHIPPING_NOTIFICATION_PATH)
  @HttpCode(204)
  async handleShippingNotification(
    @Body() notification: ShippingNotifications,
  ): Promise<any> {
    Logger.log(
      `Idempotency: ${notification.idempotency_key}`,
      'NotificationHandler - handleShippingNotification',
    );
    return await this.shippingService.handleShippingNotification(notification);
  }

  @Post(PomeloEnum.POMELO_SHIPPING_CARD_EVENTS)
  @HttpCode(204)
  async handleCardEvents(@Body() event: CardEvents): Promise<any> {
    Logger.log(`Idempotency: ${event.idempotency_key}`, 'EventHandler');
    return await this.shippingService.handleCardEvents(event);
  }
}
