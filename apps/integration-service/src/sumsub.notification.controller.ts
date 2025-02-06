import { Traceable } from '@amplication/opentelemetry-nestjs';
import { ApiKeyCheck } from '@auth/auth/decorators/api-key-check.decorator';
import { ApiKeyAuthGuard } from '@auth/auth/guards/api.key.guard';
import { SumsubSignatureGuard } from '@auth/auth/guards/sumsub.signature.guard';
import { SumsubConfigEnum } from '@integration/integration/enum/sumsub.config.enum';
import { SumsubApplicantOnHold } from '@integration/integration/identity/generic/domain/process/sumsub.applicant.onhold.dto';
import { SumsubApplicantPending } from '@integration/integration/identity/generic/domain/process/sumsub.applicant.pending.dto';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { SumsubApplicantReviewed } from './../../../libs/integration/src/identity/generic/domain/process/sumsub.applicant.reviewed.dto';
import { SumsubNotificationIntegrationService } from './services/sumsub.notification.integration.service';

@Traceable()
@Controller('sumsub')
@UseGuards(ApiKeyAuthGuard, SumsubSignatureGuard)
//@UseInterceptors(SumsubSignatureInterceptor)
export class SumsubNotificationIntegrationController {
  constructor(
    @InjectPinoLogger(SumsubNotificationIntegrationController.name)
    protected readonly logger: PinoLogger,
    private readonly sumsubService: SumsubNotificationIntegrationService,
  ) {}

  @Post(SumsubConfigEnum.SUMSUB_NOTIFICATION_REVIEWED_PATH)
  @ApiKeyCheck()
  @HttpCode(HttpStatus.OK)
  async handleNotificationReviewed(
    @Req() req,
    @Body() notification: SumsubApplicantReviewed,
  ) {
    await this.sumsubService.validateClient(req.clientApi);
    this.logger.info(
      `Notification Reviewed body ${JSON.stringify(notification)}`,
    );
    this.logger.info(
      `Notification Reviewed headers ${JSON.stringify(req.headers)}`,
    );
    await this.sumsubService.updateUserByReviewed(notification);
    return {
      statusCode: HttpStatus.OK,
      description: 'received reviewed',
    };
  }

  @Post(SumsubConfigEnum.SUMSUB_NOTIFICATION_PENDING_PATH)
  @ApiKeyCheck()
  @HttpCode(HttpStatus.OK)
  async handleNotificationPending(
    @Req() req: Request,
    @Body() notification: SumsubApplicantPending,
  ): Promise<any> {
    this.logger.info(
      `Notification Reviewed body ${JSON.stringify(notification)}`,
    );
    this.logger.info(
      `Notification Reviewed headers ${JSON.stringify(req.headers)}`,
    );
    await this.sumsubService.updateUserByPending(notification);
    return {
      statusCode: HttpStatus.OK,
      description: 'received pending',
    };
  }

  @Post(SumsubConfigEnum.SUMSUB_NOTIFICATION_ON_HOLD_PATH)
  @ApiKeyCheck()
  @HttpCode(HttpStatus.OK)
  async handleNotificationOnHold(
    @Req() req: Request,
    @Body() notification: SumsubApplicantOnHold,
  ): Promise<any> {
    this.logger.info(
      `Notification Reviewed body ${JSON.stringify(notification)}`,
    );
    this.logger.info(
      `Notification Reviewed headers ${JSON.stringify(req.headers)}`,
    );
    await this.sumsubService.updateUserByOnHold(notification);
    return {
      statusCode: HttpStatus.OK,
      description: 'received on hold',
    };
  }
}
