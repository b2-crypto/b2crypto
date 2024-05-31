import { EnvironmentEnum } from '@common/common/enums/environment.enum';
import { CrmDocument } from '@crm/crm/entities/mongoose/crm.schema';
import { BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, {
  AxiosInstance,
  AxiosResponse,
  CreateAxiosDefaults,
} from 'axios';
import { DepositDto } from './dto/deposit.dto';
import { WalletDto } from './dto/wallet.dto';
import { IntegrationCryptoInterface } from './integration.crypto.interface';
import { CryptoRoutesInterface } from './interface/crypto.routes.interface';
import { AccountDocument } from '@account/account/entities/mongoose/account.schema';
import { CommonService } from '@common/common';
import { FetchData } from '@common/common/models/fetch-data.model';

export class IntegrationCryptoService<
  // DTO
  TDepositDto = DepositDto,
  TWalletDto = WalletDto,
> implements IntegrationCryptoInterface<TDepositDto, TWalletDto>
{
  http: AxiosInstance;
  private routesMap: CryptoRoutesInterface;
  private urlBase: string;
  private apiKey: string;
  private token: string;
  private isProd: boolean;
  private urlEncoded = true;
  protected tokenCrm: string;

  constructor(
    public cryptoAccount: AccountDocument,
    protected configService: ConfigService,
  ) {
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

  setToken(token: string) {
    this.token = token;
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
      } else {
        this.urlEncoded = false;
        const req = {
          data: {
            type: 'auth-token',
            attributes: {
              login: this.cryptoAccount.accountName,
              password: this.cryptoAccount.accountPassword,
            },
          },
        };
        try {
          const token = await this.fetch('POST', this.routesMap.auth, req);
          const today = new Date();
          this.token = token.data?.attributes.access;
          const expireIn = token.data?.expiresIn || token.data?.ExpiresIn;
        } catch (err) {
          Logger.error(err, `${IntegrationCryptoService.name}:err`);
          Logger.error(
            this.urlBase,
            `${IntegrationCryptoService.name}:urlBase`,
          );
          Logger.error(req, `${IntegrationCryptoService.name}:token`);
          throw new BadRequestException(err);
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

  private async fetch(method: string, uri: string, data?: any, headers?) {
    headers = headers ?? {};
    headers['Content-type'] = 'application/vnd.api+json';
    const fetchData = {
      urlBase: this.urlBase,
      token: this.token,
      headers,
      method,
      data,
      uri,
    } as FetchData;
    Logger.log(fetchData, 'fetchData');
    return CommonService.fetch(fetchData);
  }

  async getWallet(walletId: string): Promise<AxiosResponse<any[]>> {
    const rta = this.http.get(
      this.routesMap.getWallet.replace('{id}', walletId),
    );
    return rta;
  }

  async createDeposit(depositDto: TDepositDto): Promise<AxiosResponse<any[]>> {
    Logger.log(depositDto, 'createDeposit');
    Logger.log(JSON.stringify(depositDto), 'createDeposit');
    const rta = await this.fetch(
      'POST',
      this.routesMap.createDeposit,
      depositDto,
    );
    return rta;
  }

  async getDeposit(depositId: string): Promise<AxiosResponse<any[]>> {
    const rta = this.http.get(
      this.routesMap.getDeposit.replace('{id}', depositId),
    );
    return rta;
  }
}
