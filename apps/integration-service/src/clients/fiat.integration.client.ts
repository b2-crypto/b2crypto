import { Traceable } from '@amplication/opentelemetry-nestjs';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

export interface IExchangeRate {
  success: boolean;
  query: IQuery;
  info: IInfo;
  date: string;
  result: number;
}

export interface IQuery {
  from: string;
  to: string;
  amount: number;
}

export interface IInfo {
  timestamp: number;
  rate: number;
}

@Traceable()
@Injectable()
export class FiatIntegrationClient {
  constructor(
    @InjectPinoLogger(FiatIntegrationClient.name)
    protected readonly logger: PinoLogger,
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
  ): Promise<number> {
    const apiURL = process.env.CURRENCY_CONVERSION_API_URL;
    const apiKey = process.env.CURRENCY_CONVERSION_API_KEY;
    const toParsed = to === 'USDT' ? 'USD' : to;
    const fromParsed = from === 'USDT' ? 'USD' : from;
    const url = `${apiURL}?access_key=${apiKey}&from=${fromParsed}&to=${toParsed}&amount=${amount}`;

    const data = await fetch(url, {
      method: 'GET',
    })
      .then<IExchangeRate>((res) => res.json())
      .catch((error) => {
        this.logger.error(`[getCurrencyConversion] ${error.message || error}`);

        throw new InternalServerErrorException(error);
      });

    this.logger.info(`[getCurrencyConversion] ${JSON.stringify(data)}`);

    return data.result;
  }
}
