import { PomeloRestClient } from '@integration/integration/client/pomelo.integration.client';
import { PomeloEnum } from '@integration/integration/enum/pomelo.enum';
import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  Logger,
  Param,
} from '@nestjs/common';
import { AccountServiceService } from 'apps/account-service/src/account-service.service';

@Controller(PomeloEnum.POMELO_INTEGRATION_CONTROLLER)
export class PomeloSensitiveInfoController {
  constructor(
    private readonly pomeloClient: PomeloRestClient,
    private readonly cardService: AccountServiceService,
  ) {}

  @Get(PomeloEnum.POMELO_SENSITIVE_INFO_PATH)
  @HttpCode(200)
  async issuePomeloPrivateInfoToken(@Param('cardId') cardId): Promise<any> {
    Logger.log(`Looking for card: ${cardId}`, 'PomeloSensitiveInfoController');
    const cardList = await this.cardService.findAll({
      where: {
        'cardConfig.id': `${cardId}`,
      },
    });
    const card = cardList.list[0];
    if (!card) {
      throw new BadRequestException('Card not found');
    }
    return await this.pomeloClient.getSensitiveInfoToken(
      card.cardConfig?.user_id || '',
    );
  }
}
