import { Traceable } from '@amplication/opentelemetry-nestjs';
import { HttpService } from '@nestjs/axios';
import { Inject, Injectable } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { lastValueFrom } from 'rxjs';
import { Logger } from 'winston';

@Traceable()
@Injectable()
export class FiatIntegrationClient {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: Logger,
    private httpService: HttpService,
  ) {}

  async getCurrencyConversionCustodial(
    from: string,
    amount: number,
  ): Promise<any> {
    const to = process.env.DEFAULT_CURRENCY_CONVERSION_COIN;
    return this.getCurrencyConversion(to, from, amount);
  }

  async getCurrencyConversion(
    to: string,
    from: string,
    amount: number,
  ): Promise<any> {
    const apiURL = process.env.CURRENCY_CONVERSION_API_URL;
    const apiKey = process.env.CURRENCY_CONVERSION_API_KEY;
    const toParsed = to === 'USDT' ? 'USD' : to;
    const fromParsed = from === 'USDT' ? 'USD' : from;

    const url = `${apiURL}?access_key=${apiKey}&from=${fromParsed}&to=${toParsed}&amount=${amount}`;
    this.logger.debug(url, 'FiatIntegrationClient.getCurrencyConversion');
    const obsResponse = this.httpService.get(url);
    const data = await (await lastValueFrom(obsResponse)).data;
    return data.result;
  }
}
