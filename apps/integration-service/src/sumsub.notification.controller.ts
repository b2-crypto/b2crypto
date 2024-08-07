import { ApiKeyCheck } from '@auth/auth/decorators/api-key-check.decorator';
import { ApiKeyAuthGuard } from '@auth/auth/guards/api.key.guard';
import { SumsubSignatureGuard } from '@auth/auth/guards/sumsub.signature.guard';
import { SumsubConfigEnum } from '@integration/integration/enum/sumsub.config.enum';
import { SumsubApplicantPending } from '@integration/integration/identity/generic/domain/process/sumsub.applicant.pending.dto';
import {
  Body,
  Controller,
  HttpCode,
  Logger,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SumsubApplicantReviewed } from './../../../libs/integration/src/identity/generic/domain/process/sumsub.applicant.reviewed.dto';
import { SumsubNotificationIntegrationService } from './services/sumsub.notification.integration.service';

@Controller('sumsub')
@UseGuards(ApiKeyAuthGuard, SumsubSignatureGuard)
//@UseInterceptors(SignatureInterceptor)
export class SumsubNotificationIntegrationController {
  private secret = 'zyPoKDIxcPqJNtSi4BtjK1RV62g';
  constructor(
    private readonly sumsubService: SumsubNotificationIntegrationService,
  ) {}

  @Post(SumsubConfigEnum.SUMSUB_NOTIFICATION_REVIEWED_PATH)
  @ApiKeyCheck()
  @HttpCode(200)
  async handleNotificationReviewed(
    @Req() req: Request,
    @Body() notification: SumsubApplicantReviewed,
  ) {
    Logger.log(notification, 'Notification Reviewed body');
    Logger.log(req.headers, 'Notification Reviewed headers');
    return {
      statusCode: 200,
      description: 'received reviewed',
    };
  }

  @Post(SumsubConfigEnum.SUMSUB_NOTIFICATION_PENDING_PATH)
  @HttpCode(200)
  async handleNotificationPending(
    @Req() req: Request,
    @Body() notification: SumsubApplicantPending,
  ): Promise<any> {
    Logger.log(notification, 'Notification Reviewed body');
    Logger.log(req.headers, 'Notification Reviewed headers');
    return {
      statusCode: 200,
      description: 'received pending',
    };
  }

  @Post(SumsubConfigEnum.SUMSUB_NOTIFICATION_ON_HOLD_PATH)
  @HttpCode(200)
  async handleNotificationOnHold(
    @Req() req: Request,
    @Body() notification: SumsubApplicantPending,
  ): Promise<any> {
    Logger.log(notification, 'Notification Reviewed body');
    Logger.log(req.headers, 'Notification Reviewed headers');
    return {
      statusCode: 200,
      description: 'received on hold',
    };
  }
}
