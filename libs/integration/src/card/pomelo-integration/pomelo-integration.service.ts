import { AccountDocument } from '@account/account/entities/mongoose/account.schema';
import { ConfigService } from '@nestjs/config';
import { AxiosInstance, AxiosResponse } from 'axios';
import { CardDto } from '../generic/dto/card.dto';
import { UserCardDto } from '../generic/dto/user.card.dto';
import { UserResponseDto } from '../generic/dto/user.response.dto';
import { IntegrationCardService } from '../generic/integration.card.service';

export class PomeloIntegrationService extends IntegrationCardService<
  UserCardDto,
  CardDto,
  UserResponseDto
> {
  http: AxiosInstance;
  protected tokenInformationCard: string;

  constructor(
    _account: AccountDocument,
    protected configService: ConfigService,
  ) {
    super(_account, configService);
    this.setClient({
      id: this.account?.id ?? 'b2crypto',
      secret:
        this.account?.secret ??
        'eRIIDxqovn5sBhFII7_E9aGrSu3CiU7aLpr5tw2As3-PjU78rro2Q2uoob0qw54F',
      audience: this.account?.audience ?? 'https://auth-staging.pomelo.la',
      url: this.account?.url ?? 'https://api-sandbox.pomelo.la',
      grantType: this.account?.grantType ?? 'client_credentials',
    });
    this.setRouteMap({
      // Auth
      auth: '/oauth/token',
      // User
      createUser: '/users/v1/',
      updateUser: '/users/v1/{id}',
      searchUser: '/users/v1/',
      // Card
      createCard: 'cards/v1/',
      updateCard: '/cards/v1/{id}',
      activateCard: '/cards/v1/activation',
      searchCard: '/cards/v1/',
      searchAffinityGroupCard: '/cards/v1/config/affinity-groups/',
      associateCard: '/cards/associations/v1/',
      disassociateCard: '/cards/associations/v1/',
      searchAssociationCard: '/cards/associations/v1/',
      // Sensible Information
      getTokenInformationCard: '/secure-data/v1/token',
      getInformationCard: 'https://secure-data-web.pomelo.la/v1/{card_id}',
      // Shipping
      createShippingCard: '/shipping/v1',
      searchShippingCard: '/shipping/v1',
      updateShippingCard: '/shipping/v1/{shipment_id}',
      historyShippingCard: '/shipping/v1/{shipment_id}/history',
      receiverShippingCard: '/shipping/v1/{shipment_id}/receiver',
      // Provisioning
      visaApplePayCard: '/token-provisioning/visa/apple-pay',
      mastercardApplePayCard: '/token-provisioning/mastercard/apple-pay',
      visaGooglePayCard: '/token-provisioning/visa/google-pay',
      mastercardGooglePayCard: '/token-provisioning/mastercard/google-pay',
    });
  }

  setTokenInformationCard(token: string) {
    this.tokenInformationCard = token;
  }

  /* getUser(userCard: UserCardDto): Promise<AxiosResponse<any[], any>> {
    throw new Error('Method not implemented.');
  }
  createUser(userCard: UserCardDto): Promise<AxiosResponse<any[], any>> {
    throw new Error('Method not implemented.');
  }
  updateUser(userCard: UserCardDto): Promise<AxiosResponse<any[], any>> {
    throw new Error('Method not implemented.');
  }

  getCards(card: CardDto): Promise<AxiosResponse<any[], any>> {
    throw new Error('Method not implemented.');
  }
  createCards(card: CardDto): Promise<AxiosResponse<any[], any>> {
    throw new Error('Method not implemented.');
  }
  updateCards(card: CardDto): Promise<AxiosResponse<any[], any>> {
    throw new Error('Method not implemented.');
  }
  
  getAffinityGroup(userCard: CardDto): Promise<AxiosResponse<any[], any>> {
    throw new Error('Method not implemented.');
  }
  getInformationCard(
    userCard: UserCardDto,
    card: CardDto,
  ): Promise<AxiosResponse<any[], any>> {
    throw new Error('Method not implemented.');
  }
  sendPhysicalCard(
    userCard: UserCardDto,
    card: CardDto,
  ): Promise<AxiosResponse<any[], any>> {
    throw new Error('Method not implemented.');
  } */
}
