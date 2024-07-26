import { PomeloRestClient } from '@integration/integration/client/pomelo.integration.client';
import { PomeloEnum } from '@integration/integration/enum/pomelo.enum';
import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  Inject,
  Logger,
  Param,
  Request,
} from '@nestjs/common';
import { AccountServiceService } from 'apps/account-service/src/account-service.service';
import { UserServiceService } from 'apps/user-service/src/user-service.service';

@Controller(PomeloEnum.POMELO_INTEGRATION_CONTROLLER)
export class PomeloSensitiveInfoController {
  constructor(
    @Inject(UserServiceService)
    private readonly userService: UserServiceService,
    private readonly pomeloClient: PomeloRestClient,
  ) {}

  @Get(PomeloEnum.POMELO_SENSITIVE_INFO_PATH)
  @HttpCode(200)
  async issuePomeloPrivateInfoToken(@Request() req: any): Promise<any> {
    Logger.log(
      `Looking for user: ${req.user}`,
      'PomeloSensitiveInfoController',
    );
    // HARD CODED USER ID
    const user = await this.userService.getOne('66855fed6e4f611aac8c7ab3');
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const pomeloUser = user?.userCard?.id || '';
    Logger.log(
      `User: ${user?.email || 'NOT FOUND'}`,
      'PomeloSensitiveInfoController',
    );
    return await this.pomeloClient.getSensitiveInfoToken(pomeloUser);
  }
}
