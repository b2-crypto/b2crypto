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
import { PomeloIntegrationSFTPService } from './services/pomelo.integration.sftp.service';

@Controller()
export class PomeloIntegrationServiceController {
  constructor(
    private readonly integrationServiceService: PomeloIntegrationProcessService,
    private readonly sftpService: PomeloIntegrationSFTPService,
  ) {}

  @Post(PomeloEnum.POMELO_NOTIFICATION_PATH)
  @UseGuards(SignatureGuard)
  @UseInterceptors(SignatureInterceptor)
  @HttpCode(204)
  async processNotification(
    @Body() notification: NotificationDto,
    @Headers() headers: any,
  ): Promise<any> {
    Logger.log(
      `Idempotency: ${notification.idempotency_key}`,
      'NotificationHandler',
    );
    return await this.integrationServiceService.processNotification(
      notification,
      headers,
    );
  }

  @Post(PomeloEnum.POMELO_ADJUSTMENT_PATH)
  @UseGuards(SignatureGuard)
  @UseInterceptors(SignatureInterceptor)
  @HttpCode(204)
  async processAdjustment(
    @Body() adjustment: Adjustment,
    @Headers(PomeloEnum.POMELO_IDEMPOTENCY_HEADER) idempotency: string,
    @Headers() headers: any,
  ): Promise<any> {
    Logger.log(`Idempotency: ${idempotency}`, 'AdjustmentHandler');
    adjustment.idempotency = idempotency;
    return await this.integrationServiceService.processAdjustment(
      adjustment,
      headers,
    );
  }

  @Post(PomeloEnum.POMELO_AUTHORIZATION_PATH)
  @UseGuards(SignatureGuard)
  @UseInterceptors(SignatureInterceptor)
  @HttpCode(200)
  async processAuthorization(
    @Body() authorization: Authorization,
    @Headers(PomeloEnum.POMELO_IDEMPOTENCY_HEADER) idempotency: string,
    @Headers() headers: any,
  ): Promise<any> {
    Logger.log(`Idempotency: ${idempotency}`, 'AuthorizationHandler');
    authorization.idempotency = idempotency;
    return await this.integrationServiceService.processAuthorization(
      authorization,
      headers,
    );
  }

  @Post('/sftp/download')
  downloadSFTPReports() {
    this.sftpService.getSFTPPomeloReportsByClient('b2crypto', 'col');
  }
}
