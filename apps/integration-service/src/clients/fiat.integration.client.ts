import { Traceable } from '@amplication/opentelemetry-nestjs';
import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';

@Traceable()
@Injectable()
export class FiatIntegrationClient {
  constructor(private httpService: HttpService) {}

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
    Logger.log(url, 'FiatIntegrationClient.getCurrencyConversion');
    const obsResponse = this.httpService.get(url);
    const data = await (await lastValueFrom(obsResponse)).data;
    return data.result;
  }
}
