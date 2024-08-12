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
  Logger,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SumsubApplicantReviewed } from './../../../libs/integration/src/identity/generic/domain/process/sumsub.applicant.reviewed.dto';
import { SumsubNotificationIntegrationService } from './services/sumsub.notification.integration.service';

@Controller('sumsub')
@UseGuards(ApiKeyAuthGuard, SumsubSignatureGuard)
//@UseInterceptors(SumsubSignatureInterceptor)
export class SumsubNotificationIntegrationController {
  constructor(
    private readonly sumsubService: SumsubNotificationIntegrationService,
  ) {}

  @Post(SumsubConfigEnum.SUMSUB_NOTIFICATION_REVIEWED_PATH)
  @ApiKeyCheck()
  @HttpCode(200)
  async handleNotificationReviewed(
    @Req() req,
    @Body() notification: SumsubApplicantReviewed,
  ) {
    await this.sumsubService.validateClient(req.clientApi);
    Logger.log(notification, 'Notification Reviewed body');
    Logger.log(req.headers, 'Notification Reviewed headers');
    await this.sumsubService.updateUserByReviewed(notification);
    return {
      statusCode: 200,
      description: 'received reviewed',
    };
  }

  @Post(SumsubConfigEnum.SUMSUB_NOTIFICATION_PENDING_PATH)
  @ApiKeyCheck()
  @HttpCode(200)
  async handleNotificationPending(
    @Req() req: Request,
    @Body() notification: SumsubApplicantPending,
  ): Promise<any> {
    Logger.log(notification, 'Notification Reviewed body');
    Logger.log(req.headers, 'Notification Reviewed headers');
    await this.sumsubService.updateUserByPending(notification);
    return {
      statusCode: 200,
      description: 'received pending',
    };
  }

  @Post(SumsubConfigEnum.SUMSUB_NOTIFICATION_ON_HOLD_PATH)
  @ApiKeyCheck()
  @HttpCode(200)
  async handleNotificationOnHold(
    @Req() req: Request,
    @Body() notification: SumsubApplicantOnHold,
  ): Promise<any> {
    Logger.log(notification, 'Notification Reviewed body');
    Logger.log(req.headers, 'Notification Reviewed headers');
    await this.sumsubService.updateUserByOnHold(notification);
    return {
      statusCode: 200,
      description: 'received on hold',
    };
  }
}
