import { AccountDocument } from '@account/account/entities/mongoose/account.schema';
import { CommonService } from '@common/common';
import { EnvironmentEnum } from '@common/common/enums/environment.enum';
import { FetchData } from '@common/common/models/fetch-data.model';
import { Cache } from '@nestjs/cache-manager';
import {
  BadRequestException,
  Logger,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common';
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
    protected cacheManager: Cache,
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
          this.token = await this.cacheManager.get('token-B2BinPay');
          if (!this.token) {
            const token = await this.fetch('POST', this.routesMap.auth, req);
            console.log('token =>', token);

            if (!token.data) {
              Logger.error(token, 'Token crypto not found');
              throw new NotFoundException(
                `Token crypto not found: ${token.errors[0].detail}`,
                IntegrationCryptoService.name,
              );
            }

            this.token = token.data?.attributes.access;
            await this.cacheManager.set(
              'token-B2BinPay',
              this.token,
              4 * 60 * 1000,
            );
            const expireIn = token.data?.expiresIn || token.data?.ExpiresIn;
          }
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
    return CommonService.fetch(fetchData);
  }

  async getWallet(walletId: string): Promise<AxiosResponse<any[]>> {
    const rta = this.http.get(
      this.routesMap.getWallet.replace('{id}', walletId),
    );
    return rta;
  }

  async createDeposit(depositDto: TDepositDto): Promise<AxiosResponse<any[]>> {
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
  async getTransferByDeposit(
    depositId: string,
    pageNumber = 1,
    dateRange = null,
  ): Promise<AxiosResponse<any[]>> {
    let query =
      `${this.routesMap.getTransferByDeposit}` +
      `?filter[op_id]=${depositId}` +
      `&filter[op_type]=1` +
      `&filter[status]=2` +
      `&filter[created_at_from]=` +
      `&filter[created_at_to]=` +
      `&page[number]=${pageNumber}` +
      `&page[SIZE]=100`;
    if (dateRange) {
      const { from, to } = dateRange;
      if (from) {
        query = query.replace(
          'filter[created_at_from]=',
          `filter[created_at_from]=${from}`,
        );
      } else {
        query = query.replace('&filter[created_at_from]=', '');
      }
      if (to) {
        query = query.replace(
          'filter[created_at_to]=',
          `filter[created_at_to]=${to}`,
        );
      } else {
        query = query.replace('&filter[created_at_to]=', '');
      }
    }
    const rta = await this.fetch('GET', query);
    return rta;
  }

  async getAvailablerWallets(): Promise<WalletDto[]> {
    throw new NotImplementedException('Method not implemented.');
  }
  async resendNotifications(): Promise<any> {
    throw new NotImplementedException('Method not implemented.');
  }
  async validateAddress(assetId: string, address: string): Promise<any> {
    throw new NotImplementedException('Method not implemented.');
  }
}
