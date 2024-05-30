import { EnvironmentEnum } from '@common/common/enums/environment.enum';
import { CrmDocument } from '@crm/crm/entities/mongoose/crm.schema';
import { BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  CreateAxiosDefaults,
} from 'axios';
import { UserCardDto } from './dto/user.card.dto';
import { UserResponseDto } from './dto/user.response.dto';
import { IntegrationCardInterface } from './integration.card.interface';
import { CardRoutesInterface } from './interface/card.routes.interface';
import { CardDto } from './dto/card.dto';
import { ClientCardDto } from './dto/client.card.dto';
import { AccountDocument } from '@account/account/entities/mongoose/account.schema';
import { Readable } from 'stream';
import { URLSearchParams } from 'url';
import { CommonService } from '@common/common';

export class IntegrationCardService<
  // DTO
  TUserCardDto = UserCardDto,
  TCardDto = CardDto,
  // Results
  TUserResponse = UserResponseDto,
> implements IntegrationCardInterface<TUserCardDto, TCardDto, TUserResponse>
{
  http: AxiosInstance;
  private routesMap: CardRoutesInterface;
  private client: ClientCardDto;
  private token: string;
  private isProd: boolean;
  private urlEncoded = true;
  protected tokenInformationCard: string;

  constructor(
    public account: AccountDocument,
    protected configService: ConfigService,
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
  async createUser(userCard: TUserCardDto): Promise<AxiosResponse<any[], any>> {
    //return this.http.post(this.routesMap.createUser, userCard);
    return this.fetch('POST', this.routesMap.createUser, userCard);
  }
  async updateUser(userCard: TUserCardDto): Promise<AxiosResponse<any[], any>> {
    return this.http.patch(this.routesMap.updateUser, userCard);
  }

  async getCard(card: TCardDto): Promise<AxiosResponse<any[], any>> {
    return this.http.get(this.routesMap.searchCard, card);
  }
  async createCard(card: TCardDto): Promise<AxiosResponse<any[], any>> {
    //return this.http.post(this.routesMap.createCard, card);
    return this.fetch('POST', this.routesMap.createCard, card);
  }
  async updateCard(card: TCardDto): Promise<AxiosResponse<any[], any>> {
    return this.http.patch(this.routesMap.updateCard, card);
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
      this.tokenInformationCard = await this.http.post(
        this.routesMap.getTokenInformationCard,
        {
          user_id: userCard['id'],
        },
      );
    }
    return this.http.get(
      this.routesMap.getInformationCard.replace('{id}', card['id']),
    );
  }
  sendPhysicalCard(
    userCard: TUserCardDto,
    card: TCardDto,
  ): Promise<AxiosResponse<any[], any>> {
    throw new Error('Method not implemented.');
  }
}
