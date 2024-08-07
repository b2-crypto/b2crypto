import { ApiKeyAuthGuard } from '@auth/auth/guards/api.key.guard';
import { SignatureGuard } from '@auth/auth/guards/pomelo.signature.guard';
import { SignatureInterceptor } from '@common/common/interceptors/pomelo.signature.interceptor';
import { SumsubConfigEnum } from '@integration/integration/enum/sumsub.config.enum';
import { SumsubApplicantPending } from '@integration/integration/identity/generic/domain/process/sumsub.applicant.pending.dto';
import {
  Body,
  Controller,
  HttpCode,
  Logger,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { SumsubApplicantReviewed } from './../../../libs/integration/src/identity/generic/domain/process/sumsub.applicant.reviewed.dto';
import { SumsubNotificationIntegrationService } from './services/sumsub.notification.integration.service';
import { ApiKeyCheck } from '@auth/auth/decorators/api-key-check.decorator';

@Controller('sumsub')
@UseGuards(ApiKeyAuthGuard, SignatureGuard)
@UseInterceptors(SignatureInterceptor)
export class SumsubNotificationIntegrationController {
  private secret = 'zyPoKDIxcPqJNtSi4BtjK1RV62g';
  constructor(
    private readonly sumsubService: SumsubNotificationIntegrationService,
  ) {}

  @Post(SumsubConfigEnum.SUMSUB_NOTIFICATION_REVIEWED_PATH)
  @ApiKeyCheck()
  @HttpCode(200)
  async handleNotificationReviewed(
    @Body() notification: SumsubApplicantReviewed,
  ) {
    //Logger.log(notification, 'Notification Reviewed Handler');
    return {
      statusCode: 200,
      description: 'received',
    };
  }

  @Post(SumsubConfigEnum.SUMSUB_NOTIFICATION_PENDING_PATH)
  @HttpCode(200)
  async handleNotificationPending(
    @Body() notification: SumsubApplicantPending,
  ): Promise<any> {
    Logger.log(notification, 'Notification Pending Handler');
  }

  @Post(SumsubConfigEnum.SUMSUB_NOTIFICATION_ON_HOLD_PATH)
  @HttpCode(200)
  async handleNotificationOnHold(
    @Body() notification: SumsubApplicantPending,
  ): Promise<any> {
    Logger.log(notification, 'Notification OnHold Handler');
  }
}
