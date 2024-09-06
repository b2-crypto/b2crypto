import { EnvironmentEnum } from '@common/common/enums/environment.enum';
import { BasicDataIntegration } from '@integration/integration/domain/basic.data.integration.interface';
import { Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { SumsubEnum } from './domain/sumsub.enum';
import {
  SumsubIssuedTokenDto,
  SumsubIssueTokenDto,
} from './domain/sumsub.issue.token.dto';
import { RequestMetadataDto } from './domain/sumsub.request.metadata.dto';
import { IntegrationIdentityInterface } from './integration.identity.interface';
import { IdentityRoutesInterface } from './interface/identity.routes.interface';
import * as crypto from 'crypto';
import { CommonService } from '@common/common';

export class IntegrationIdentityService
  implements IntegrationIdentityInterface
{
  http: AxiosInstance;
  env: EnvironmentEnum;
  private routesMap: IdentityRoutesInterface;

  constructor(private dataIntegration: BasicDataIntegration) {}

  setRouteMap(routesMap: IdentityRoutesInterface) {
    this.routesMap = routesMap;
  }

  getRouteMap(): IdentityRoutesInterface {
    return this.routesMap;
  }

  private createAxiosInstance() {
    const baseURL = this.dataIntegration.urlApi;
    const appToken = this.dataIntegration.token;
    const axiosInstance = axios.create({
      baseURL,
    });
    axiosInstance.defaults.headers[SumsubEnum.SUMSUB_HEADER_APP_TOKEN] =
      appToken;
    axiosInstance.defaults.headers['Accept'] = '*/*';
    axiosInstance.defaults.headers['Content-Type'] = 'application/json';
    return axiosInstance;
  }

  private async fetch(method: string, uri: string, data?: any, headers?) {
    headers = headers ?? {};
    headers['Content-Type'] = 'application/json';
    headers['Accept'] = '*/*';
    headers[SumsubEnum.SUMSUB_HEADER_APP_TOKEN] = this.dataIntegration.token;
    return CommonService.fetch({
      urlBase: this.dataIntegration.urlApi,
      headers,
      method,
      data,
      uri,
    });
  }

  private createSignature(requestMetadata: RequestMetadataDto) {
    const secretKey = this.dataIntegration.privateKey;
    const valueToSign =
      requestMetadata.ts +
      requestMetadata.method.toUpperCase() +
      requestMetadata.url.toString() +
      (requestMetadata.data ?? '');
    const signature = crypto.createHmac('sha256', secretKey);
    signature.update(valueToSign);
    return signature.digest('hex');
  }

  async generateUrlApplicant(
    issueTokenDto: SumsubIssueTokenDto,
  ): Promise<SumsubIssuedTokenDto> {
    try {
      const issueUrlPath = `/resources/sdkIntegrations/levels/${issueTokenDto.levelName}/websdkLink?ttlInSecs=${issueTokenDto.ttlInSecs}&externalUserId=${issueTokenDto.userId}`;
      const metadata: RequestMetadataDto = {
        method: 'POST',
        url: issueUrlPath,
        ts: Math.floor(Date.now() / 1000).toString(),
        //data: null,
      };
      const axiosInstance = this.createAxiosInstance();
      const signature = this.createSignature(metadata);
      axiosInstance.defaults.headers[SumsubEnum.SUMSUB_HEADER_TIMESTAMP] =
        metadata.ts;
      axiosInstance.defaults.headers[SumsubEnum.SUMSUB_HEADER_SIGNATURE] =
        signature;
      Logger.log('IssueSumsubToken', 'ISSUING SUMSUB TOKEN');
      return axiosInstance
        .post(metadata.url, null)
        .then((response) => {
          return response.data;
        })
        .catch((error) => {
          Logger.error('IssueSumsubToken:84', error);
          return error;
        });
    } catch (error) {
      Logger.error('IssueSumsubToken', error);
      throw error;
    }
  }
  async generateTokenApplicant(
    issueTokenDto: SumsubIssueTokenDto,
  ): Promise<SumsubIssuedTokenDto> {
    try {
      const issueTokenPath =
        '/resources/accessTokens' +
        `?userId=${issueTokenDto.userId}` +
        `&ttlInSecs=${issueTokenDto.ttlInSecs}` +
        `&levelName=${issueTokenDto.levelName}`;
      const metadata: RequestMetadataDto = {
        method: 'POST',
        url: issueTokenPath,
        ts: Math.floor(Date.now() / 1000).toString(),
      };
      const headers = {};
      const signature = this.createSignature(metadata);
      headers[SumsubEnum.SUMSUB_HEADER_TIMESTAMP] = metadata.ts;
      headers[SumsubEnum.SUMSUB_HEADER_SIGNATURE] = signature;
      Logger.log(headers, 'fetchConfig - generateUrlApplicant');
      return this.fetch(metadata.method, metadata.url, null, headers)
        .then((response) => {
          return response;
        })
        .catch((error) => {
          Logger.error(error, 'IssueSumsubToken:94');
          return error;
        });
      // const axiosInstance = this.createAxiosInstance();
      // const signature = this.createSignature(metadata);
      // axiosInstance.defaults.headers[SumsubEnum.SUMSUB_HEADER_TIMESTAMP] =
      //   metadata.ts;
      // axiosInstance.defaults.headers[SumsubEnum.SUMSUB_HEADER_SIGNATURE] =
      //   signature;
      // Logger.log('IssueSumsubToken', 'ISSUING SUMSUB TOKEN');
      // return axiosInstance
      //   .post(metadata.url, null)
      //   .then((response) => {
      //     return response.data;
      //   })
      //   .catch((error) => {
      //     Logger.error('IssueSumsubToken:84', error);
      //     return error;
      //   });
    } catch (error) {
      Logger.error('IssueSumsubToken', error);
      throw error;
    }
  }
}
