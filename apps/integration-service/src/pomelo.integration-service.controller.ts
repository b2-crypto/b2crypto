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
      `[processNotification] NotificationHandler - processNotification ${JSON.stringify(
        notification,
      )}`,
    );
    const result = await this.integrationServiceService.processNotification(
      notification,
      headers,
    );

    this.logger.info(`[processNotification] result: ${JSON.stringify(result)}`);

    return result;
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
    this.logger.info(`[processAdjustment] Idempotency: ${idempotency}`);
    adjustment.idempotency = idempotency;
    this.logger.info(`[processAdjustment] ${JSON.stringify(adjustment)}`);
    const result = await this.integrationServiceService.processAdjustment(
      adjustment,
      headers,
    );

    this.logger.info(`[processAdjustment] result: ${JSON.stringify(result)}`);

    return result;
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
    this.logger.info(`[processAuthorization] Idempotency: ${idempotency}`);
    authorization.idempotency = idempotency;
    this.logger.info(`[processAuthorization] Authorization: ${authorization}`);
    const result = await this.integrationServiceService.processAuthorization(
      authorization,
      headers,
    );

    this.logger.info(
      `[processAuthorization] result: ${JSON.stringify(result)}`,
    );

    return result;
  }

  @Post('/sftp/download')
  @HttpCode(HttpStatus.OK)
  downloadSFTPReports() {
    this.sftpService.getSFTPPomeloReportsByClient('b2crypto', 'col');

    return { statusCode: HttpStatus.OK };
  }
}
