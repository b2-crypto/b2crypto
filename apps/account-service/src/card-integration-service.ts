import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { IntegrationService } from '@integration/integration';
import { User } from '@user/user/entities/mongoose/user.schema';
import { AccountDocument } from '@account/account/entities/mongoose/account.schema';
import IntegrationCardEnum from '@integration/integration/card/enums/IntegrationCardEnum';
import { AddressSchema } from '@person/person/entities/mongoose/address.schema';
import { UserCard } from '@account/account/entities/mongoose/user-card.schema';
import { ConfigCardActivateDto } from '@account/account/dto/config.card.activate.dto';
import { CommonService } from '@common/common';
import DocIdTypeEnum from '@common/common/enums/DocIdTypeEnum';
import { CardDto } from '@integration/integration/card/generic/dto/card.dto';
import pug from 'pug';
import { AccountServiceService } from './account-service.service';
interface PomeloResponse<T = any> {
  data: T;
  error?: {
    details?: Array<{ detail: string }>;
    message?: string;
  };
}

interface GenericResponse {
  data: any;
  error?: {
    message?: string;
  };
}

interface CardActivationRequest {
  pin: string;
  pan: string;
  previous_card_id?: string;
}

@Injectable()
export class CardIntegrationService {
  constructor(
    private readonly integration: IntegrationService,
    private readonly accountService: AccountServiceService,
  ) {}

  async getCardIntegrationWithUser(user: User) {
    const cardIntegration = await this.integration.getCardIntegration(
      IntegrationCardEnum.POMELO,
    );
    if (!cardIntegration) {
      throw new BadRequestException('Bad integration card');
    }

    if (!user.userCard) {
      user.userCard = await this.getUserCard(cardIntegration, user);
    }

    return cardIntegration;
  }

  async getUserCard(
    cardIntegration: any,
    user: User,
    account?: AccountDocument,
  ): Promise<UserCard> {
    try {
      const response: PomeloResponse = await cardIntegration.getUser({
        email: user.email.toLowerCase(),
      });

      if (response?.data?.length > 0) {
        return response.data[0];
      }

      return await this.createUserCard(cardIntegration, user, account);
    } catch (error) {
      Logger.error(error, 'Error getting user card');
      throw new BadRequestException('Error getting user card');
    }
  }

  private async createUserCard(
    cardIntegration: any,
    user: User,
    account?: AccountDocument,
  ): Promise<UserCard> {
    const birthDate = account?.personalData?.birth ?? user.personalData.birth;
    if (!birthDate) {
      throw new BadRequestException('Birth date not found');
    }

    const userCardData = {
      name: account?.personalData?.name ?? user.personalData.name,
      surname: account?.personalData?.lastName ?? user.personalData.lastName,
      identification_type: this.getDocumentType(
        account?.personalData?.typeDocId ?? user.personalData.typeDocId,
      ),
      identification_value:
        account?.personalData?.numDocId ??
        user.personalData.numDocId?.toString(),
      birthdate: this.formatDate(new Date(birthDate)),
      gender: account?.personalData?.gender ?? user.personalData.gender,
      email: account?.email ?? user.personalData.email[0] ?? user.email,
      phone:
        account?.telephone ??
        user.personalData.telephones[0]?.phoneNumber ??
        user.personalData.phoneNumber,
      nationality: 'COL',
      legal_address: this.buildUserAddress(
        account?.personalData?.location.address ??
          user.personalData.location.address,
      ),
      operation_country: 'COL',
    };

    const response: PomeloResponse = await cardIntegration.createUser(
      userCardData,
    );
    if (response?.error) {
      throw new BadRequestException(
        response.error?.message || 'Error creating user card',
      );
    }

    return response.data;
  }

  private buildUserAddress(address: AddressSchema) {
    if (!address.street_name || !address.city || !address.region) {
      throw new BadRequestException('Incomplete address information');
    }

    return {
      street_name: address.street_name,
      street_number: ' ',
      city: address.city,
      region: address.region,
      country: 'COL',
      neighborhood: address.neighborhood || ' ',
      apartment: address.apartment || ' ',
      zip_code: address.zip_code || '000000',
      floor: address.floor || ' ',
      additional_info: ' ',
    };
  }

  private getDocumentType(docType: string): string {
    switch (docType) {
      case DocIdTypeEnum.PERMISO_PROTECCION_TEMPORAL:
        return 'PPT';
      case DocIdTypeEnum.PASSPORT:
        return 'PASSPORT';
      default:
        return docType;
    }
  }

  private formatDate(date: Date): string {
    return `${date.getFullYear()}-${CommonService.getNumberDigits(
      date.getMonth() + 1,
      2,
    )}-${CommonService.getNumberDigits(date.getDate(), 2)}`;
  }

  async activateCard(user: User, configActivate: ConfigCardActivateDto) {
    if (!configActivate.pan) {
      throw new BadRequestException('PAN code is necessary');
    }

    const cardIntegration = await this.getCardIntegrationWithUser(user);

    if (!configActivate.pin || configActivate.pin.length !== 4) {
      configActivate.pin = CommonService.getNumberDigits(
        CommonService.randomIntNumber(9999),
        4,
      );
    }

    const activationRequest: CardActivationRequest = {
      pin: configActivate.pin,
      pan: configActivate.pan,
      previous_card_id: configActivate.prevCardId,
    };

    const response: PomeloResponse = await cardIntegration.activateCard(
      user.userCard,
      activationRequest,
    );

    if (response?.error) {
      const errorDetails = (response.error.details || []).map(
        (err) => err.detail,
      );
      throw new BadRequestException(errorDetails.join(','));
    }

    return response.data;
  }

  async getCardStatus(cardId: string) {
    const cardIntegration = await this.integration.getCardIntegration(
      IntegrationCardEnum.POMELO,
    );

    if (!cardIntegration) {
      throw new BadRequestException('Bad integration card');
    }

    try {
      const result = await cardIntegration.getCard({ id: cardId } as CardDto);

      if (!result || typeof result !== 'object') {
        throw new BadRequestException('Invalid response format');
      }

      const resultData: any = 'data' in result ? result.data : result;
      const responseData = resultData?.data || resultData;

      if (!responseData) {
        throw new BadRequestException('No data received');
      }

      if (responseData.error) {
        throw new BadRequestException(
          responseData.error.message || 'Error getting card status',
        );
      }

      return responseData;
    } catch (error) {
      Logger.error(error, 'Error getting card status');
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Error getting card status',
      );
    }
  }

  async getSensitiveCardInfo(cardId: string, user: User): Promise<string> {
    if (!cardId) {
      throw new BadRequestException('Need cardId to search');
    }

    const cardList = await this.accountService.findAll({
      where: {
        _id: cardId,
      },
    });

    if (!cardList?.totalElements || !cardList?.list[0]?.cardConfig) {
      throw new BadRequestException('CardId is not valid');
    }

    const cardIdPomelo = cardList.list[0].cardConfig.id;
    const cardIntegration = await this.getCardIntegrationWithUser(user);

    if (!user.userCard) {
      user.userCard = await this.getUserCard(cardIntegration, user);
    }

    const token = await cardIntegration.getTokenCardSensitive(user.userCard.id);

    const url = 'https://secure-data-web.pomelo.la';
    const width = 'width="100%"';
    const height = 'height="270em"';
    const locale = 'es';
    const urlStyles =
      'https://cardsstyles.s3.eu-west-3.amazonaws.com/cardsstyles2.css';

    const html = pug.render(
      '<iframe ' +
        `${width} ` +
        `${height} ` +
        'allow="clipboard-write" ' +
        'class="iframe-list" ' +
        'scrolling="no" ' +
        `src="${url}/v1/${cardIdPomelo}?auth=${token['access_token']}&styles=${urlStyles}&field_list=pan,code,pin,name,expiration&layout=card&locale=${locale}" ` +
        'frameBorder="0">' +
        '</iframe>',
    );

    return html;
  }
}
