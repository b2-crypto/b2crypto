import { EnvironmentEnum } from '@common/common/enums/environment.enum';
import { CrmDocument } from '@crm/crm/entities/mongoose/crm.schema';
import { BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, {
  AxiosInstance,
  AxiosResponse,
  CreateAxiosDefaults,
} from 'axios';
import { Observable } from 'rxjs';
import { TrackVisitDto } from './dto/track.visit.dto';
import { UserResponseDto } from './dto/user.response.dto';
import { IntegrationCryptoInterface } from './integration.crypto.interface';
import { CryptoRoutesInterface } from './interface/crypto.routes.interface';

export class IntegrationCryptoService<
  // DTO
  TTrackVisitDto = TrackVisitDto,
  // Results
  TUserResponse = UserResponseDto,
> implements IntegrationCryptoInterface<TTrackVisitDto, TUserResponse>
{
  http: AxiosInstance;
  private routesMap: CryptoRoutesInterface;
  private username: string;
  private password: string;
  private urlBase: string;
  private apiKey: string;
  private token: string;
  private isProd: boolean;
  private urlEncoded = true;
  protected tokenCrm: string;

  constructor(public crm: CrmDocument, protected configService: ConfigService) {
    this.isProd =
      this.configService.get<string>('ENVIRONMENT') === EnvironmentEnum.prod;
  }

  setRouteMap(routesMap: CryptoRoutesInterface) {
    this.routesMap = routesMap;
  }

  getRouteMap(): CryptoRoutesInterface {
    return this.routesMap;
  }

  setUrlBase(urlBase: string) {
    this.urlBase = urlBase;
  }

  setUsername(username: string) {
    this.username = username;
  }

  setPassword(password: string) {
    this.password = password;
  }

  setToken(token: string) {
    this.token = token;
  }

  setTokenCrm(tokenCrm: string) {
    this.tokenCrm = tokenCrm;
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateHttp() {
    if (!!this.urlBase) {
      const param = {
        baseURL: this.urlBase,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Accept-Encoding': '*',
        },
      } as CreateAxiosDefaults;
      if (!!this.token) {
        param.headers['Authorization'] = 'Bearer ' + this.token;
      } else if (!!this.apiKey) {
        param.params = {
          apikey: this.apiKey,
        };
      } else {
        this.urlEncoded = false;
        try {
          const token = await axios.post(`${this.urlBase}token`, {
            username: this.username,
            password: this.password,
          });
          const today = new Date();
          this.token = token.data?.Token || token.data.token;
          const expireIn = token.data?.expiresIn || token.data?.ExpiresIn;
        } catch (err) {
          Logger.error(err, IntegrationCryptoService.name);
          Logger.error(
            'integration.card.service.ts:151 ->',
            IntegrationCryptoService.name,
          );
          Logger.error(
            `urlBase -> ${this.urlBase}`,
            IntegrationCryptoService.name,
          );
          Logger.error(
            `token -> ${JSON.stringify({
              username: this.username,
              password: this.password,
            })}`,
            IntegrationCryptoService.name,
          );
          //throw new BadRequestException(err);
        }
        // Todo[hender] Save token and check if already expire
        //this.dateToExpireToken = today.getTime() + expireIn;
        param.headers['Authorization'] = 'Bearer ' + this.token;
        param.headers['Api-Version'] = 3;
      }
      //axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
      this.http = axios.create(param);
    } else {
      throw new BadRequestException('The "UrlBase" is necessary');
    }
  }

  affiliateTrackVisit(
    trackVisitDto: TTrackVisitDto,
  ): Observable<AxiosResponse<any[]>> {
    const rta = this.http.get(this.routesMap.affiliateTrackVisit);
    return rta as any;
  }
}
