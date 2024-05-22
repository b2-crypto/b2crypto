import { Body, Controller, Delete, Inject, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AccountServiceController } from './account-service.controller';
import { AccountCreateDto } from '@account/account/dto/account.create.dto';
import { BuildersService } from '@builder/builders';
import { AccountServiceService } from './account-service.service';
import { IntegrationService } from '@integration/integration';
import { IntegrationCardService } from '@integration/integration/card/generic/integration.card.service';
import IntegrationCardEnum from '@integration/integration/card/enums/IntegrationCardEnum';
import { UserCardDto } from '@integration/integration/card/generic/dto/user.card.dto';
import { CardDto } from '@integration/integration/card/generic/dto/card.dto';
import { UserCard } from '@account/account/entities/mongoose/user-card.schema';
import { Card } from '@account/account/entities/mongoose/card.schema';

@ApiTags('CARD')
@Controller('cards')
export class CardServiceController extends AccountServiceController {
  constructor(
    readonly cardService: AccountServiceService,
    @Inject(BuildersService)
    readonly cardBuilder: BuildersService,
    private readonly integration: IntegrationService,
  ) {
    super(cardService, cardBuilder);
  }
  @Post('create')
  async createOne(@Body() createDto: AccountCreateDto, req?: any) {
    const account = await this.cardService.createOne(createDto);
    const cardIntegration = await this.integration.getCardIntegration(
      account,
      IntegrationCardEnum.POMELO,
    );
    const userCard = await cardIntegration.createUser({
      id: '',
      name: 'Diego',
      surname: 'Pomelo',
      identification_type: 'DNI',
      identification_value: 42345678,
      birthdate: '1998-08-20',
      gender: 'MALE',
      email: 'diego.pomelo@pomelo.la',
      phone: '1123456789',
      tax_identification_type: 'CUIL',
      tax_identification_value: 20423456789,
      nationality: 'ARG',
      legal_address: {
        street_name: 'Av. Corrientes',
        street_number: 300,
        floor: 1,
        apartment: 'A',
        zip_code: 1414,
        neighborhood: 'Villa Crespo',
        city: 'CABA',
        region: 'Buenos Aires',
        additional_info: 'Torre 2',
        country: 'ARG',
      },
      operation_country: 'ARG',
    } as UserCardDto);
    account.userCardConfig = userCard as unknown as UserCard;
    const affinityGroup = await cardIntegration.getAffinityGroup(
      account.userCardConfig,
    );
    const card = cardIntegration.createCards({
      id: '',
      user_id: account.userCardConfig.id,
      affinity_group_id: 'afg-20MpN8vmIPj77ujhb9cS8ctstN2',
      card_type: 'PHYSICAL',
      address: {
        street_name: 'Street',
        street_number: '123',
        floor: '5',
        apartment: 'A',
        city: 'Buenos Aires',
        region: 'Buenos Aires',
        country: 'Argentina',
        zip_code: '5653',
        neighborhood: 'Palermo',
      },
      previous_card_id: 'crd-20gRqyp809SvDzXzhSeG2w6UiO5',
      pin: '2023',
      name_on_card: 'Dieguito',
    } as CardDto);
    account.cardConfig = card as unknown as Card;
    account.save();
    return account;
  }
  @Delete(':cardID')
  deleteOneById(@Param('cardID') id: string, req?: any) {
    return this.getAccountService().deleteOneById(id);
  }
}
