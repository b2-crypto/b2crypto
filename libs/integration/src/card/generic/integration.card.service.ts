import { AccountDocument } from '@account/account/entities/mongoose/account.schema';
import { CommonService } from '@common/common';
import { EnvironmentEnum } from '@common/common/enums/environment.enum';
import {
  BadRequestException,
  Logger,
  NotImplementedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, {
  AxiosInstance,
  AxiosResponse,
  CreateAxiosDefaults,
} from 'axios';
import { randomUUID } from 'crypto';
import { CardDto, CardSearchDto } from './dto/card.dto';
import { ClientCardDto } from './dto/client.card.dto';
import { ShippingDto } from './dto/shipping.dto';
import { UserCardDto } from './dto/user.card.dto';
import { UserResponseDto } from './dto/user.response.dto';
import { IntegrationCardInterface } from './integration.card.interface';
import { CardRoutesInterface } from './interface/card.routes.interface';
import { ShippingResultInterface } from './interface/shipping-result.interface';
import { ConfigCardActivateDto } from '@account/account/dto/config.card.activate.dto';

export class IntegrationCardService<
  // DTO
  TUserCardDto = UserCardDto,
  TCardDto = CardDto,
  TCardSearchDto = CardSearchDto,
  TShippingDto = ShippingDto,
  // Results
  TUserResponse = UserResponseDto,
  TShippingResponse = ShippingResultInterface,
> implements
    IntegrationCardInterface<
      TUserCardDto,
      TCardDto,
      TCardSearchDto,
      TUserResponse
    >
{
  http: AxiosInstance;
  private routesMap: CardRoutesInterface;
  private client: ClientCardDto;
  private token: string;
  private isProd: boolean;
  private urlEncoded = true;
  protected tokenInformationCard: string;

  constructor(
    protected configService: ConfigService,
    public account?: AccountDocument,
  ) {
    this.isProd =
      this.configService.get<string>('ENVIRONMENT') === EnvironmentEnum.prod;
  }

  setRouteMap(routesMap: CardRoutesInterface) {
    this.routesMap = routesMap;
  }

  getRouteMap(): CardRoutesInterface {
    return this.routesMap;
  }

  setClient(client: ClientCardDto) {
    this.client = client;
  }

  setToken(token: string) {
    this.token = token;
  }

  setTokenInformationCard(token: string) {
    this.tokenInformationCard = token;
  }

  async generateHttp() {
    if (!!this.client.url) {
      const param = {
        baseURL: this.client.url,
        headers: {
          'Content-Type': 'application/json',
          Accept: '*/*',
          'Accept-Encoding': 'gzip, deflate, br',
        },
      } as CreateAxiosDefaults;
      if (!this.token) {
        this.urlEncoded = false;
        try {
          const token = await this.fetch('POST', this.routesMap.auth, {
            client_id: this.client.id,
            client_secret: this.client.secret,
            audience: this.client.audience,
            grant_type: this.client.grantType,
          });
          this.token = token.access_token;
          /* const token = await axios.post(
            `${this.client.url}${this.routesMap.auth}`,
            {
              client_id: this.client.id,
              client_secret: this.client.secret,
              audience: this.client.audience,
              grant_type: this.client.grantType,
            },
            {
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
              },
            },
          );
          this.token = token.data.access_token; */
        } catch (err) {
          Logger.error(err, IntegrationCardService.name);
          Logger.error(
            'integration.card.service.ts:151 ->',
            IntegrationCardService.name,
          );
          Logger.error(
            `urlBase -> ${this.client.url}`,
            IntegrationCardService.name,
          );
          Logger.error(
            `token -> ${JSON.stringify({
              client_id: this.client.id,
              client_secret: this.client.secret,
              audience: this.client.audience,
              grant_type: this.client.grantType,
            })}`,
            IntegrationCardService.name,
          );
          return null;
        }
        // Todo[hender] Save token and check if already expire
        //this.dateToExpireToken = today.getTime() + expireIn;
      }
      param.headers['Authorization'] = 'Bearer ' + this.token;
      //axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
      this.http = axios.create(param);
    } else {
      throw new BadRequestException('The "UrlBase" is necessary');
    }
  }

  private async fetch(method: string, uri: string, data?: any, headers?) {
    return CommonService.fetch({
      getFormatKey: this.routesMap.getFormatKey,
      urlBase: this.client.url,
      token: this.token,
      headers,
      method,
      data,
      uri,
    });
  }

  async getUser(userCard: TUserCardDto): Promise<AxiosResponse<any[], any>> {
    //return this.http.get(this.routesMap.searchUser, userCard);
    return this.fetch('GET', this.routesMap.searchUser, userCard);
  }
  async getUsersByQuery(query: any) {
    let path = '';
    if (query.userId) {
      path = `${this.routesMap.searchUser}/${query.userId}`;
    } else {
      path = `${this.routesMap.searchUser}?filter[size]=${query.page_size}&filter[page]=${query.page}`;
    }
    return await this.fetch('GET', path);
  }
  async createUser(userCard: TUserCardDto): Promise<AxiosResponse<any[], any>> {
    //return this.http.post(this.routesMap.createUser, userCard);
    return this.fetch('POST', this.routesMap.createUser, userCard);
  }
  async updateUser(userCard: TUserCardDto): Promise<AxiosResponse<any[], any>> {
    return this.http.patch(this.routesMap.updateUser, userCard);
  }

  async getCard(card: TCardDto): Promise<AxiosResponse<any[], any>> {
    return await this.fetch('GET', this.routesMap.searchCard, card);
  }
  async getCardByQuery(query: CardSearchDto) {
    const path = `${this.routesMap.searchCard}?filter[user_id]=${query.user_id}&page[size]=${query.page_size}`;
    return await this.fetch('GET', path);
  }
  async createCard(card: any): Promise<AxiosResponse<any[], any>> {
    //return this.http.post(this.routesMap.createCard, card);
    return this.fetch('POST', this.routesMap.createCard, card);
  }
  async shippingPhysicalCard(
    shipping: TShippingDto,
  ): Promise<AxiosResponse<TShippingResponse, any>> {
    //TODO [hender-2024/07/25] Certification Pomelo
    //return this.http.post(this.routesMap.createCard, card);
    return this.fetch('POST', this.routesMap.createShippingCard, shipping);
  }
  async getShippingPhysicalCard(
    idShipping: string,
  ): Promise<AxiosResponse<TShippingResponse, any>> {
    //TODO [hender-2024/07/25] Certification Pomelo
    //return this.http.post(this.routesMap.createCard, card);
    return this.fetch(
      'GET',
      this.routesMap.searchShippingCard + `/${idShipping}`,
    );
  }
  async updateCard(card: TCardDto): Promise<AxiosResponse<any[], any>> {
    const cardId = card['id'];
    delete card['id'];
    return this.http.patch(
      this.routesMap.updateCard.replace('{id}', cardId),
      card,
    );
  }
  async activateCard(
    userCard: TUserCardDto,
    configActivate: ConfigCardActivateDto,
  ): Promise<AxiosResponse<any[], any>> {
    if (!this.token) {
      await this.generateHttp();
    }
    const request = {
      user_id: userCard['id'],
      pin: configActivate.pin,
      previous_card_id: undefined,
      pan: configActivate.pan,
    };
    if (configActivate.prevCardId) {
      request.previous_card_id = configActivate.prevCardId;
    }
    //return this.http.post(this.routesMap.activateCard, request);
    return this.fetch('POST', this.routesMap.activateCard, request);
  }

  async getAffinityGroup(
    userCard: TUserCardDto,
  ): Promise<AxiosResponse<any[], any>> {
    //return this.http.get(this.routesMap.searchAffinityGroupCard);
    return this.fetch('GET', this.routesMap.searchAffinityGroupCard);
  }
  async getInformationCard(
    userCard: TUserCardDto,
    card: TCardDto,
  ): Promise<AxiosResponse<any[], any>> {
    if (!this.tokenInformationCard) {
      this.tokenInformationCard = await this.getTokenCardSensitive(
        userCard['id'],
      );
    }
    return this.http.get(
      this.routesMap.getInformationCard.replace('{id}', card['id']),
    );
  }
  async getTokenCardSensitive(userCardId: string) {
    this.tokenInformationCard = await this.fetch(
      'POST',
      this.routesMap.getTokenInformationCard,
      {
        user_id: userCardId,
      },
    );
    // this.tokenInformationCard = await this.http.post(
    //   this.routesMap.getTokenInformationCard,
    //   {
    //     user_id: userCardId,
    //   },
    // );
    return this.tokenInformationCard;
  }
  sendPhysicalCard(
    userCard: TUserCardDto,
    card: TCardDto,
  ): Promise<AxiosResponse<any[], any>> {
    throw new NotImplementedException('Method not implemented.');
  }
}
