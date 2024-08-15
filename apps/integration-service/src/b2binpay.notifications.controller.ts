import { AllowAnon } from '@auth/auth/decorators/allow-anon.decorator';
import { ApiKeyAuthGuard } from '@auth/auth/guards/api.key.guard';
import { BuildersService } from '@builder/builders';
import {
  Body,
  Controller,
  Inject,
  Logger,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';

@Controller('b2binpay')
@UseGuards(ApiKeyAuthGuard)
export class B2BinPayNotificationsController {
  constructor(
    private readonly builder: BuildersService,
    @Inject(SchedulerRegistry)
    private schedulerRegistry: SchedulerRegistry,
  ) {}

  // ----------------------------
  @AllowAnon()
  @Post('status-deposit')
  // @CheckPoliciesAbility(new PolicyHandlerTransferRead())
  async b2binpayStatusDeposit(@Body() data: any) {
    Logger.debug(data);
  }

  @AllowAnon()
  @Post('status')
  // @CheckPoliciesAbility(new PolicyHandlerTransferRead())
  async b2binpayStatus(@Body() data: any) {
    Logger.debug(data);
  }
}
