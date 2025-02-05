import { Traceable } from '@amplication/opentelemetry-nestjs';
import { PomeloSignatureGuard } from '@auth/auth/guards/pomelo.signature.guard';
import { PomeloSignatureInterceptor } from '@common/common/interceptors/pomelo.signature.interceptor';
import {
  Adjustment,
  Authorization,
  NotificationDto,
} from '@integration/integration/dto/pomelo.process.body.dto';
import { PomeloEnum } from '@integration/integration/enum/pomelo.enum';
import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { PomeloIntegrationProcessService } from './services/pomelo.integration.process.service';
import { PomeloIntegrationSFTPService } from './services/pomelo.integration.sftp.service';

@Traceable()
@Controller()
export class PomeloIntegrationServiceController {
  constructor(
    @InjectPinoLogger(PomeloIntegrationServiceController.name)
    protected readonly logger: PinoLogger,
    private readonly integrationServiceService: PomeloIntegrationProcessService,
    private readonly sftpService: PomeloIntegrationSFTPService,
  ) {}

  @Post(PomeloEnum.POMELO_NOTIFICATION_PATH)
  @UseGuards(PomeloSignatureGuard)
  @UseInterceptors(PomeloSignatureInterceptor)
  @HttpCode(HttpStatus.NO_CONTENT)
  async processNotification(
    @Body() notification: NotificationDto,
    @Headers() headers: any,
  ): Promise<any> {
    this.logger.info(
      'NotificationHandler - processNotification',
      `Idempotency: ${notification.idempotency_key}`,
    );
    const result = await this.integrationServiceService.processNotification(
      notification,
      headers,
    );

    this.logger.info('NotificationHandler', result);

    return { ...result, statusCode: HttpStatus.NO_CONTENT };
  }

  @Post(PomeloEnum.POMELO_ADJUSTMENT_PATH)
  @UseGuards(PomeloSignatureGuard)
  @UseInterceptors(PomeloSignatureInterceptor)
  @HttpCode(HttpStatus.NO_CONTENT)
  async processAdjustment(
    @Body() adjustment: Adjustment,
    @Headers(PomeloEnum.POMELO_IDEMPOTENCY_HEADER) idempotency: string,
    @Headers() headers: any,
  ): Promise<any> {
    this.logger.info(`Idempotency: ${idempotency}`, 'AdjustmentHandler');
    adjustment.idempotency = idempotency;
    this.logger.info('AdjustmentHandler', adjustment);
    const result = await this.integrationServiceService.processAdjustment(
      adjustment,
      headers,
    );

    this.logger.info('AdjustmentHandler', result);

    return { ...result, statusCode: HttpStatus.NO_CONTENT };
  }

  @Post(PomeloEnum.POMELO_AUTHORIZATION_PATH)
  @UseGuards(PomeloSignatureGuard)
  @UseInterceptors(PomeloSignatureInterceptor)
  @HttpCode(HttpStatus.OK)
  async processAuthorization(
    @Body() authorization: Authorization,
    @Headers(PomeloEnum.POMELO_IDEMPOTENCY_HEADER) idempotency: string,
    @Headers() headers: any,
  ): Promise<any> {
    this.logger.info(`Idempotency: ${idempotency}`, 'AuthorizationHandler');
    authorization.idempotency = idempotency;
    this.logger.info('AuthorizationHandler', authorization);
    const result = await this.integrationServiceService.processAuthorization(
      authorization,
      headers,
    );

    this.logger.info('AuthorizationHandler', result);

    return { ...result, statusCode: HttpStatus.OK };
  }

  @Post('/sftp/download')
  downloadSFTPReports() {
    this.sftpService.getSFTPPomeloReportsByClient('b2crypto', 'col');
  }
}
