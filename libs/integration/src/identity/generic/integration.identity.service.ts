import { EnvironmentEnum } from '@common/common/enums/environment.enum';
import { BasicDataIntegration } from '@integration/integration/domain/basic.data.integration.interface';
import { PspDocument } from '@psp/psp/entities/mongoose/psp.schema';
import { AxiosInstance, AxiosRequestConfig } from 'axios';
import { IntegrationIdentityInterface } from './integration.identity.interface';
import { IdentityRoutesInterface } from './interface/identity.routes.interface';
import { createHmac } from 'crypto';

export class IntegrationIdentityService
  implements IntegrationIdentityInterface
{
  http: AxiosInstance;
  env: EnvironmentEnum;
  private routesMap: IdentityRoutesInterface;

  constructor(
    private dataIntegration: BasicDataIntegration,
    public payment?: PspDocument,
  ) {}

  setRouteMap(routesMap: IdentityRoutesInterface) {
    this.routesMap = routesMap;
  }

  getRouteMap(): IdentityRoutesInterface {
    return this.routesMap;
  }

  async getToken<TRequest, TResponse = any>(
    queryParams: TRequest,
    config?: AxiosRequestConfig<TRequest>,
  ): Promise<TResponse> {
    config = config || {};
    config.data = queryParams;
    return this.http.get(this.routesMap.accessToken, config);
  }

  createSignature(config) {
    const ts = Math.floor(Date.now() / 1000);
    const signature = createHmac('sha256', SUMSUB_SECRET_KEY);
    signature.update(ts + config.method.toUpperCase() + config.url);

    if (config.data instanceof FormData) {
      signature.update(config.data.getBuffer());
    } else if (config.data) {
      signature.update(config.data);
    }

    config.headers['X-App-Access-Ts'] = ts;
    config.headers['X-App-Access-Sig'] = signature.digest('hex');

    return config;
  }
}
