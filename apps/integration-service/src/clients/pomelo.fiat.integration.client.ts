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

    //const axiosInstance = axios.create({ baseURL: process.env.URL });
    const axiosInstance = axios.create({
      baseURL: 'https://api.exchangeratesapi.io/v1/convert',
    });
    const queryParams = {
      //access_key: process.env.API_KEY_CURRENCY,
      access_key: '79e1291da641abba50546e9f29986759',
      from,
      //to: process.env.DEFAULT_CURRENCY_TO_CONVERT,
      to: 'USD',
      amount,
    };

    return axiosInstance
      .get('', { params: queryParams })
      .then((response) => {
        total = response['_body'].result;
        return total;
      })
      .catch((error) => {
        Logger.error('CurrencyConversion', error);
      });
    /* const from = process.amount.local.currency;
    const amount = process.amount.local.total;
    let total = 0;

    const axiosInstance = this.buildAxiosInstance();
    return axiosInstance
      .get('', {}, { params: this.buildRequestParams(amount, from) })
      .then((response) => {
        total = response['_body'].result;
        return total;
      })
      .catch((error) => {
        Logger.error('CurrencyConversion', error);
      }); */
  }
}
