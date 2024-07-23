import { SignatureGuard } from '@auth/auth/guards/pomelo.signature.guard';
import { SignatureInterceptor } from '@common/common/interceptors/pomelo.signature.interceptor';
import {
  Adjustment,
  AdjustmentDto,
  Authorization,
  AuthorizationDto,
  NotificationDto,
} from '@integration/integration/dto/pomelo.process.body.dto';
import { PomeloEnum } from '@integration/integration/enum/pomelo.enum';
import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Logger,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PomeloIntegrationProcessService } from './services/pomelo.integration.process.service';

@Controller()
export class PomeloIntegrationServiceController {
  constructor(
    private readonly integrationServiceService: PomeloIntegrationProcessService,
  ) {}

  @Post(PomeloEnum.POMELO_NOTIFICATION_PATH)
  @UseGuards(SignatureGuard)
  @UseInterceptors(SignatureInterceptor)
  @HttpCode(200)
  async processNotification(
    @Body() notification: NotificationDto,
  ): Promise<any> {
    Logger.log('ProcessNotification', notification);
    return await this.integrationServiceService.processNotification(
      notification,
    );
  }

  @Post(PomeloEnum.POMELO_ADJUSTMENT_PATH)
  @UseGuards(SignatureGuard)
  @UseInterceptors(SignatureInterceptor)
  @HttpCode(204)
  async processAdjustment(
    @Body() adjustment: Adjustment,
    @Headers(PomeloEnum.POMELO_IDEMPOTENCY_HEADER) idempotency: string,
  ): Promise<any> {
    adjustment.idempotency = idempotency;
    return await this.integrationServiceService.processAdjustment(adjustment);
  }

  @Post(PomeloEnum.POMELO_AUTHORIZATION_PATH)
  @UseGuards(SignatureGuard)
  @UseInterceptors(SignatureInterceptor)
  @HttpCode(200)
  async processAuthorization(
    @Body() authorization: Authorization,
    @Headers() headers: any,
    @Headers(PomeloEnum.POMELO_IDEMPOTENCY_HEADER) idempotency: string,
  ): Promise<any> {
    Logger.log(`Idempotency: ${idempotency}`, 'AuthorizationHandler');
    authorization.idempotency = idempotency;
    return await this.integrationServiceService.processAuthorization(
      authorization,
    );
  }
}
