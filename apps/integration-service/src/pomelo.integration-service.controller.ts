import {
  Body,
  Controller,
  HttpCode,
  Logger,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PomeloEnum } from './enum/pomelo.enum';
import { SignatureGuard } from '@auth/auth/guards/pomelo.signature.guard';
import { SignatureInterceptor } from '@common/common/interceptors/pomelo.signature.interceptor';
import {
  AdjustmentDto,
  AuthorizationDto,
  NotificationDto,
} from './dto/pomelo.process.body.dto';
import { PomeloIntegrationService } from './services/pomelo.integration.process.service';

@Controller()
export class PomeloIntegrationServiceController {
  constructor(
    private readonly integrationServiceService: PomeloIntegrationService,
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
  async processAdjustment(@Body() adjustment: AdjustmentDto): Promise<any> {
    return await this.integrationServiceService.processAdjustment(adjustment);
  }

  @Post(PomeloEnum.POMELO_AUTHORIZATION_PATH)
  @UseGuards(SignatureGuard)
  @UseInterceptors(SignatureInterceptor)
  @HttpCode(200)
  async processAuthorization(
    @Body() authorization: AuthorizationDto,
  ): Promise<any> {
    return await this.integrationServiceService.processAuthorization(
      authorization,
    );
  }
}
