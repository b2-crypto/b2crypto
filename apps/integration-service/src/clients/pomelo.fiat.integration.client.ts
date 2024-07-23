import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class FiatIntegrationClient {
  constructor(private httpService: HttpService) {}

  async getCurrencyConversion(txnProcess: any): Promise<any> {
    const apiURL = process.env.URL;
    const apiKey = process.env.API_KEY_CURRENCY;
    const to = process.env.DEFAULT_CURRENCY_TO_CONVERT;
    const from = txnProcess.amount.local.currency;
    const amount = txnProcess.amount.local.total;

    const url = `${apiURL}?access_key=${apiKey}&from=${from}&to=${to}&amount=${amount}`;

    const obsResponse = this.httpService.get(url);
    const data = await (await lastValueFrom(obsResponse)).data;
    return data.result;
  }
}
