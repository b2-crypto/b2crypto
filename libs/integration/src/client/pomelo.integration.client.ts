import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class PomeloRestClient {
  constructor(
    private httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private readonly POMELO_API_URL: string =
    this.configService.get<string>('POMELO_API_URL');
  private readonly POMELO_CLIENT_ID: string =
    this.configService.get<string>('POMELO_CLIENT_ID');
  private readonly POMELO_SECRET_ID: string =
    this.configService.get<string>('POMELO_SECRET_ID');
  private readonly POMELO_AUDIENCE: string =
    this.configService.get<string>('POMELO_AUDIENCE');
  private readonly POMELO_AUTH_GRANT_TYPE: string =
    this.configService.get<string>('POMELO_AUTH_GRANT_TYPE');

  private async authenticaticate(): Promise<string> {
    const authBody = {
      client_id: this.POMELO_CLIENT_ID,
      client_secret: this.POMELO_SECRET_ID,
      audience: this.POMELO_AUDIENCE,
      grant_type: this.POMELO_AUTH_GRANT_TYPE,
    };

    try {
      const obsResponse = this.httpService.post(
        `${this.POMELO_API_URL}/oauth/token`,
        authBody,
      );
      const data = await (await lastValueFrom(obsResponse)).data;
      return data.access_token;
    } catch (error) {
      Logger.error(error);
      throw new Error(error);
    }
  }

  async getSensitiveInfoToken(pomeloUserId: string): Promise<any> {
    const authToken = await this.authenticaticate();
    const body = {
      user_id: pomeloUserId,
    };
    const headers = {
      Authorization: `Bearer ${authToken}`,
    };

    try {
      const obsResponse = this.httpService.post(
        `${this.POMELO_API_URL}/secure-data/v1/token`,
        body,
        { headers },
      );
      return await (
        await lastValueFrom(obsResponse)
      ).data;
    } catch (error) {
      Logger.error(error);
      throw new Error(error);
    }
  }
}
