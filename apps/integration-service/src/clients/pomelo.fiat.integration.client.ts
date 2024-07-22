import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class FiatIntegrationClient {
  private readonly URL_CURRENCY_CONVERSION = process.env.URL;
  private readonly API_KEY_CURRENCY = process.env.API_KEY_CURRENCY;
  private readonly CURRENCY_TO_CONVERT =
    process.env.DEFAULT_CURRENCY_TO_CONVERT;

  private buildAxiosInstance(): any {
    const axiosInstance = axios.create({
      baseURL: this.URL_CURRENCY_CONVERSION,
    });
    return axiosInstance;
  }

  private buildRequestParams(amount: any, from: any): any {
    return {
      access_key: this.API_KEY_CURRENCY,
      from,
      to: this.CURRENCY_TO_CONVERT,
      amount,
    };
  }

  async getCurrencyConversion(process: any): Promise<any> {
    const from = process.amount.local.currency;
    const amount = process.amount.local.total;
    let total = 0;

    const axiosInstance = this.buildAxiosInstance();
    axiosInstance
      .get('', {}, { params: this.buildRequestParams(amount, from) })
      .then((response) => {
        total = response['_body'].result;
      })
      .catch((error) => {
        Logger.error('CurrencyConversion', error);
      });
    return total;
  }
}
