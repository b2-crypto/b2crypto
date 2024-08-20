import { NoCache } from '@common/common/decorators/no-cache.decorator';
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
  @NoCache()
  @HttpCode(200)
  async issuePomeloPrivateInfoToken(@Request() req: Request): Promise<any> {
    const b2cryptoUser = req['user']?.id || '';
    Logger.log(
      `Looking for user: ${b2cryptoUser}`,
      'PomeloSensitiveInfoController',
    );
    const user = await this.userService.getOne(b2cryptoUser);
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const pomeloUser = user?.userCard?.id || '';
    return await this.pomeloClient.getSensitiveInfoToken(pomeloUser);
  }
}
