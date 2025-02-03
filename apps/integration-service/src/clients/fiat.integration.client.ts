import { Traceable } from '@amplication/opentelemetry-nestjs';
import { HttpService } from '@nestjs/axios';
import { BadGatewayException, Injectable } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { lastValueFrom } from 'rxjs';

@Traceable()
@Injectable()
export class FiatIntegrationClient {
  constructor(
    @InjectPinoLogger(FiatIntegrationClient.name)
    protected readonly logger: PinoLogger,
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

    this.logger.info(url, 'FiatIntegrationClient.getCurrencyConversion');

    const data = await await lastValueFrom(this.httpService.get(url))
      .then((res) => {
        this.logger.info(
          'FiatIntegrationClient.getCurrencyConversion',
          JSON.stringify(res.data),
        );
        return res.data;
      })
      .catch((error) => {
        this.logger.error('FiatIntegrationClient.getCurrencyConversion');
        this.logger.error(error);
        throw new BadGatewayException(error);
      });

    return data.result;
  }
}
