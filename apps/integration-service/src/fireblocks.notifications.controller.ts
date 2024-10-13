import { AllowAnon } from '@auth/auth/decorators/allow-anon.decorator';
import { BuildersService } from '@builder/builders';
import { IntegrationService } from '@integration/integration';
import { Body, Controller, Inject, Logger, Post, Req } from '@nestjs/common';

@Controller('fireblocks')
//@UseGuards(ApiKeyAuthGuard)
export class FireBlocksNotificationsController {
  constructor(
    private readonly builder: BuildersService,
    @Inject(IntegrationService)
    private integrationService: IntegrationService,
  ) {}
  //private readonly integrationServiceService: PomeloIntegrationProcessService,

  // ----------------------------
  @AllowAnon()
  @Post('webhook')
  // @CheckPoliciesAbility(new PolicyHandlerTransferRead())
  async webhook(@Req() req: any, @Body() data: any) {
    Logger.debug(data, 'FireblocksNotificationsController.webhook');
    Logger.debug(
      req.headers,
      'FireblocksNotificationsController.webhook:request.headers',
    );
    Logger.debug(
      req.body,
      'FireblocksNotificationsController.webhook:request.body',
    );
    return {
      statusCode: 200,
      data: 'Webhook received',
    };
  }
}
