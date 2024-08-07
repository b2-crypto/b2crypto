import { EnvironmentEnum } from '@common/common/enums/environment.enum';
import { AxiosInstance } from 'axios';

export interface IntegrationIdentityInterface<TRequest = any, TResponse = any> {
  http: AxiosInstance;
  env: EnvironmentEnum;
  generateUrlApplicant(queryParams: TRequest): Promise<TResponse>;
}
