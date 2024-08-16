import { AllowAnon } from '@auth/auth/decorators/allow-anon.decorator';
import { ApiKeyAuthGuard } from '@auth/auth/guards/api.key.guard';
import { BuildersService } from '@builder/builders';
import {
  BadRequestException,
  Body,
  Controller,
  Inject,
  Logger,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import EventsNamesAccountEnum from 'apps/account-service/src/enum/events.names.account.enum';

@Controller('b2binpay')
//@UseGuards(ApiKeyAuthGuard)
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
  async statusDeposit(@Req() req: any, @Body() data: any) {
    Logger.debug(data, 'B2BinPayNotificationsController.statusDeposit');
    Logger.debug(
      req.headers,
      'B2BinPayNotificationsController.statusDeposit:request.headers',
    );
    Logger.debug(
      req.body,
      'B2BinPayNotificationsController.statusDeposit:request.body',
    );
    return {
      statusCode: 200,
      data: 'Tx updated deposit',
    };
  }

  @AllowAnon()
  @Post('status')
  // @CheckPoliciesAbility(new PolicyHandlerTransferRead())
  async status(@Req() req: any, @Body() data: any) {
    Logger.debug(data, 'B2BinPayNotificationsController.status');
    Logger.debug(
      req.headers,
      'B2BinPayNotificationsController.status:request.headers',
    );
    Logger.debug(
      req.body,
      'B2BinPayNotificationsController.status:request.body',
    );
    const attributes = data.data.attributes;
    const account = await this.builder.getPromiseAccountEventClient(
      EventsNamesAccountEnum.findOneById,
      attributes.tracking_id,
    );
    if (!account) {
      throw new BadRequestException('B2BinPay Account not found');
    }

    return {
      statusCode: 200,
      data: 'Tx updated',
    };
  }
}
