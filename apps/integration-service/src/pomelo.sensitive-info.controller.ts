import { BuildersService } from '@builder/builders';
import { NoCache } from '@common/common/decorators/no-cache.decorator';
import { IntegrationService } from '@integration/integration';
import IntegrationCardEnum from '@integration/integration/card/enums/IntegrationCardEnum';
import { PomeloRestClient } from '@integration/integration/client/pomelo.integration.client';
import { PomeloEnum } from '@integration/integration/enum/pomelo.enum';
import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  Inject,
  Logger,
  Request,
} from '@nestjs/common';
import { User } from '@user/user/entities/mongoose/user.schema';
import EventsNamesUserEnum from 'apps/user-service/src/enum/events.names.user.enum';
import { UserServiceService } from 'apps/user-service/src/user-service.service';

@Controller(PomeloEnum.POMELO_INTEGRATION_CONTROLLER)
export class PomeloSensitiveInfoController {
  constructor(
    private readonly builder: BuildersService,
    private readonly integration: IntegrationService,
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
    const pomeloUser = await this.getPomeloUserCard(user);
    return await this.pomeloClient.getSensitiveInfoToken(pomeloUser);
  }

  private async getPomeloUserCard(user: User) {
    if (user?.userCard?.id) {
      return user?.userCard?.id;
    }
    const cardIntegration = await this.integration.getCardIntegration(
      IntegrationCardEnum.POMELO,
    );
    if (!cardIntegration) {
      throw new BadRequestException('Bad integration card');
    }
    const rtaUserCard = await cardIntegration.getUser({
      email: user.email,
    });
    if (rtaUserCard.data.length > 0) {
      user.userCard = rtaUserCard.data[0];
      this.builder.emitUserEventClient(EventsNamesUserEnum.updateOne, {
        id: user.id,
        userCard: user.userCard,
      });
      return user?.userCard?.id || '';
    }
    throw new BadRequestException('Card user not found');
  }
}
