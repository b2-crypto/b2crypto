import { Traceable } from '@amplication/opentelemetry-nestjs';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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

export interface IPair {
  id: string;
  name: string;
  rate: number;
  validStartDatetime: string;
  validStartTimezone: string;
  validEndDatetime: string;
  validEndTimezone: string;
  isDeleted: boolean;
  createdAtDatetime: string;
  createdAtTimezone: string;
  updatedAtDatetime: any;
  updatedAtTimezone: any;
  deletedAtDatetime: any;
  deletedAtTimezone: any;
  createdBy: string;
  updatedBy: any;
  deletedBy: any;
  trmId: string;
}

@Traceable()
@Injectable()
export class FiatIntegrationClient {
  private readonly TRM_API_URL: string;

  constructor(
    @InjectPinoLogger(FiatIntegrationClient.name)
    protected readonly logger: PinoLogger,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {
    this.TRM_API_URL = this.configService.getOrThrow('TRM_ENDPOINT');
  }

  async getCurrencyConversionCustodial(
    from: string,
    amount: number,
  ): Promise<any> {
    const to = process.env.DEFAULT_CURRENCY_CONVERSION_COIN || 'USD';
    return this.getCurrencyConversion(to, from, amount);
  }

  private async getCurrentPair(pair: string): Promise<IPair | null> {
    this.logger.info(`[getCurrentPair] Consultando par: ${pair}`);

    const url = `${this.TRM_API_URL}/api/v1/pairs/current?name=${pair}`;

    this.logger.info(`[getCurrencyConversion] url: ${url}`);

    try {
      const pairCached = await this.cacheManager.get<{ value: IPair }>(pair);

      const pairResponse =
        pairCached?.value ??
        (await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }).then<IPair>((response) => response.json()));

      if (!pairCached?.value)
        await this.cacheManager.set(pair, pairResponse, 48 * 60 * 60 * 1000);

      return pairResponse;
    } catch (error) {
      this.logger.error(
        `[getCurrentPair] Error get pair: ${error.message || error}`,
      );

      throw new Error(`Error get pair`);
    }
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
    const pairName = fromParsed + toParsed;

    this.logger.info(`[getCurrencyConversion] Consultando par: ${pairName}`);

    if (!rate) throw new Error('Rate not found for ' + fromParsed + toParsed);

    const pair = await this.getCurrentPair(fromParsed + toParsed);

    if (!pair) {
      this.logger.error(`[getCurrencyConversion] Pair not found: ${pairName}`);

      throw new Error(`Pair not found`);
    }

    const swapResult = amount * pair.rate;

    this.logger.info(`[getCurrencyConversion] swapResult: ${swapResult}`);

    return swapResult;
  }
}
