import { EnvironmentEnum } from '@common/common/enums/environment.enum';
import { BasicDataIntegration } from '@integration/integration/domain/basic.data.integration.interface';
import { Logger } from '@nestjs/common';
import { PspDocument } from '@psp/psp/entities/mongoose/psp.schema';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';
import { SumsubEnum } from './domain/sumsub.enum';
import {
  SumsubIssuedTokenDto,
  SumsubIssueTokenDto,
} from './domain/sumsub.issue.token.dto';
import { RequestMetadataDto } from './domain/sumsub.request.metadata.dto';
import { IntegrationIdentityInterface } from './integration.identity.interface';
import { IdentityRoutesInterface } from './interface/identity.routes.interface';

export class IntegrationIdentityService
  implements IntegrationIdentityInterface
{
  http: AxiosInstance;
  env: EnvironmentEnum;
  private routesMap: IdentityRoutesInterface;

  constructor(private dataIntegration: BasicDataIntegration) {
    const tmp = dataIntegration;
  }

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
    axiosInstance.defaults.headers.common[SumsubEnum.SUMSUB_HEADER_APP_TOKEN] =
      appToken;
    axiosInstance.defaults.headers.common['Accept'] = '*/*';
    axiosInstance.defaults.headers.common['Content-Type'] = 'application/json';
    return axiosInstance;
  }

  private createSignature(requestMetadata: RequestMetadataDto) {
    const secretKey = this.dataIntegration.privateKey;
    const valueToSign =
      requestMetadata.ts +
      requestMetadata.method.toUpperCase() +
      requestMetadata.url.toString() +
      requestMetadata.data;
    const signature = crypto.createHmac('sha256', secretKey);
    signature.update(valueToSign);
    return signature.digest('hex');
  }

  async generateToken(
    issueTokenDto: SumsubIssueTokenDto,
  ): Promise<SumsubIssuedTokenDto> {
    try {
      const issueTokenPath = `/resources/accessTokens?userId=${issueTokenDto.userId}&ttlInSecs=${issueTokenDto.ttlInSecs}&levelName=${issueTokenDto.levelName}`;
      const metadata: RequestMetadataDto = {
        method: 'POST',
        url: issueTokenPath,
        ts: Math.floor(Date.now() / 1000).toString(),
        data: null,
      };
      const axiosInstance = this.createAxiosInstance();
      const signature = this.createSignature(metadata);
      axiosInstance.defaults.headers.common[
        SumsubEnum.SUMSUB_HEADER_TIMESTAMP
      ] = metadata.ts;
      axiosInstance.defaults.headers.common[
        SumsubEnum.SUMSUB_HEADER_SIGNATURE
      ] = signature;
      Logger.log('IssueSumsubToken', 'ISSUING SUMSUB TOKEN');
      let token: SumsubIssuedTokenDto = null;
      await axiosInstance
        .post(metadata.url, null)
        .then((response) => {
          token = response.data;
        })
        .catch((error) => Logger.error('IssueSumsubToken', error));
      return token;
    } catch (error) {
      Logger.error('IssueSumsubToken', error);
      throw error;
    }
  }
}
