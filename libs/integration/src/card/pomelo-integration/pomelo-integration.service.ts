import { AccountDocument } from '@account/account/entities/mongoose/account.schema';
import { ConfigService } from '@nestjs/config';
import { AxiosInstance, AxiosResponse } from 'axios';
import { CardDto, CardSearchDto } from '../generic/dto/card.dto';
import { UserCardDto } from '../generic/dto/user.card.dto';
import { UserResponseDto } from '../generic/dto/user.response.dto';
import { IntegrationCardService } from '../generic/integration.card.service';
import { ShippingDto } from '../generic/dto/shipping.dto';

export class PomeloIntegrationService extends IntegrationCardService<
  UserCardDto,
  CardDto,
  CardSearchDto,
  ShippingDto,
  UserResponseDto
> {
  http: AxiosInstance;
  protected tokenInformationCard: string;

  constructor(
    protected configService: ConfigService,
    _account?: AccountDocument,
  ) {
    super(configService, _account);
    this.setClient({
      id: 'BPdaVjhdJAyzPW43JI7YUM1czNoTPh2G',
      secret:
        this.account?.secret ??
        'eRIIDxqovn5sBhFII7_E9aGrSu3CiU7aLpr5tw2As3-PjU78rro2Q2uoob0qw54F',
      audience: this.account?.audience ?? 'https://auth-staging.pomelo.la',
      url: this.account?.url ?? 'https://api-sandbox.pomelo.la',
      grantType: this.account?.grantType ?? 'client_credentials',
    });
    this.setRouteMap({
      getFormatKey: 'filter[%key%]',
      // Auth
      auth: '/oauth/token',
      // User
      createUser: '/users/v1/',
      updateUser: '/users/v1/{id}',
      searchUser: '/users/v1/',
      // Card
      createCard: '/cards/v1/',
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
}
