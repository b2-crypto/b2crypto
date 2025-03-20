import { Traceable } from '@amplication/opentelemetry-nestjs';
import { Injectable, Inject } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { TrmApiResponse, TrmResponse, TrmResult } from '../interfaces/trm.interfaces';



@Traceable()
@Injectable()
export class FiatIntegrationClient {
  private trmCopUsd: number = 4000;
  private readonly TRM_CACHE_KEY = 'trm.current.COP';

  private readonly TRM_API_URL;
  private trmLastUpdated: Date = new Date();
  private trmUpdateInProgress: boolean = false;

  constructor(
    @Inject(ConfigService)
    readonly configService: ConfigService,
    @InjectPinoLogger(FiatIntegrationClient.name)
    protected readonly logger: PinoLogger,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    private readonly httpService: HttpService,
  ) {
    this.TRM_API_URL = configService.getOrThrow('TRM_ENDPOINT');
    this.initializeTrm();
  }

  private async initializeTrm(): Promise<void> {
    try {
      const result = await this.updateTrmRate();
      this.logger.info(`[initializeTrm] TRM inicial obtenida desde ${result.source}: ${result.value}`);
    } catch (error) {
      this.logger.error(`[initializeTrm] Error al obtener TRM inicial: ${error.message || error}`);
    }
  }

  private async updateTrmRate(from: string = 'COP', to: string = 'USD'): Promise<TrmResult> {
    const currencyPair = `${from}${to}`;
    const cacheKey = this.TRM_CACHE_KEY;

    if (this.trmUpdateInProgress) {
      return {
        value: this.trmCopUsd,
        source: 'default',
        updated: false,
        timestamp: this.trmLastUpdated
      };
    }

    this.trmUpdateInProgress = true;

    try {
      const cachedTrm = await this.getTrmFromCache(cacheKey);
      if (cachedTrm) {
        let rate: number;

        if ('value' in cachedTrm && typeof cachedTrm.value === 'object') {
          rate = cachedTrm.value.value;
        } else if ('rate' in cachedTrm) {
          rate = cachedTrm.rate;
        } else {
          throw new Error('Formato de caché inválido');
        }

        this.trmCopUsd = rate;
        this.trmLastUpdated = new Date();
        this.logger.info(`[updateTrmRate] TRM obtenida de cache para ${currencyPair}: ${rate}`);

        return {
          value: rate,
          source: 'cache',
          updated: true,
          timestamp: this.trmLastUpdated
        };
      }

      const trmResponse = await this.fetchTrmFromApi(currencyPair);
      if (trmResponse) {
        let rate: number;

        if ('rate' in trmResponse) {
          rate = trmResponse.rate;
        } else if ('value' in trmResponse && typeof trmResponse.value === 'object') {
          rate = trmResponse.value.value;
        } else {
          throw new Error('Formato de respuesta API inválido');
        }

        this.trmCopUsd = rate;
        this.trmLastUpdated = new Date();

        this.logger.info(`[updateTrmRate] TRM actualizada desde API y guardada en cache para ${currencyPair}: ${rate}`);

        return {
          value: rate,
          source: 'api',
          updated: true,
          timestamp: this.trmLastUpdated
        };
      }

      this.logger.warn(`[updateTrmRate] No se pudo obtener TRM nueva para ${currencyPair}, usando valor por defecto: ${this.trmCopUsd}`);

      return {
        value: this.trmCopUsd,
        source: 'default',
        updated: false,
        timestamp: this.trmLastUpdated
      };
    } catch (error) {
      this.logger.error(`[updateTrmRate] Error actualizando TRM para ${currencyPair}: ${error.message || error}`);

      return {
        value: this.trmCopUsd,
        source: 'default',
        updated: false,
        timestamp: this.trmLastUpdated
      };
    } finally {
      this.trmUpdateInProgress = false;
    }
  }

  private async fetchTrmFromApi(trmPairs: string): Promise<TrmApiResponse | TrmResponse | null> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.TRM_API_URL}/api/v1/pairs/current?name=${trmPairs}`)
      );

      if (response.data) {
        if (response.data.rate) {
          this.logger.info(`[fetchTrmFromApi] TRM obtenida de API para ${trmPairs} (nuevo formato): ${response.data.rate}`);
          await this.cacheManager.set(this.getCacheKey(trmPairs), response.data, 3600000);
          return response.data;
        } else if (response.data.value && typeof response.data.value === 'object') {
          this.logger.info(`[fetchTrmFromApi] TRM obtenida de API para ${trmPairs} (formato anterior): ${response.data.value.value}`);
          await this.cacheManager.set(this.getCacheKey(trmPairs), response.data, 3600000);
          return response.data;
        }
      }

      return null;
    } catch (error) {
      this.logger.error(`[fetchTrmFromApi] Error al obtener TRM de API para ${trmPairs}: ${error.message || error}`);
      return null;
    }
  }

  private getCacheKey(currencyPair: string): string {
    return `trm.current.${currencyPair}`;
  }

  private async getTrmFromCache(cacheKey?: string): Promise<TrmApiResponse | TrmResponse | null> {
    const key = cacheKey || this.TRM_CACHE_KEY;
    try {
      return await this.cacheManager.get(key);
    } catch (error) {
      this.logger.error(`[getTrmFromCache] Error al obtener TRM de caché para ${key}: ${error.message || error}`);
      return null;
    }
  }

  async getCurrencyConversionCustodial(
    from: string,
    amount: number,
  ): Promise<any> {
    const to = process.env.DEFAULT_CURRENCY_CONVERSION_COIN || 'USD';
    return this.getCurrencyConversion(to, from, amount);
  }

  async getCurrencyConversion(
    to: string,
    from: string,
    amount: number,
  ): Promise<number> {
    const toParsed = to === 'USDT' ? 'USD' : to;
    const fromParsed = from === 'USDT' ? 'USD' : from;

    this.logger.info(`[getCurrencyConversion] Conversión de ${fromParsed} a ${toParsed} por ${amount}`);

    if (fromParsed === toParsed) return amount;

    try {
      const currencyPair = fromParsed + toParsed;
      this.logger.info(`[getCurrencyConversion] Consultando par: ${currencyPair}`);

      const trmResponse = await this.fetchTrmFromApi(currencyPair);

      let conversionRate;

      if (trmResponse) {
        if ('rate' in trmResponse) {
          conversionRate = trmResponse.rate;
        } else if ('value' in trmResponse && typeof trmResponse.value === 'object') {
          conversionRate = trmResponse.value.value;
        }

        this.logger.info(`[getCurrencyConversion] Obtenida tasa directa para ${currencyPair}: ${conversionRate}`);
      } else {
        const trmResult = await this.updateTrmRate(fromParsed, toParsed);

        if (!trmResult.updated) {
          this.logger.warn(`[getCurrencyConversion] Usando TRM posiblemente obsoleta (${trmResult.source}): ${trmResult.value}`);
        }

        conversionRate = trmResult.value;
        this.logger.info(`[getCurrencyConversion] Usando tasa almacenada: ${conversionRate}`);
      }

      if (!conversionRate) {
        throw new Error(`Tasa de conversión no encontrada para ${fromParsed} a ${toParsed}`);
      }

      const swapFactory = (amount: number, rate: number) => amount / rate;
      const result = swapFactory(amount, conversionRate);

      this.logger.info(`[getCurrencyConversion] Usando tasa: ${conversionRate}, resultado: ${result}`);
      return result;
    } catch (error) {
      this.logger.error(`[getCurrencyConversion] Error en conversión de moneda: ${error.message || error}`);
      throw new Error(`Error al realizar conversión de ${fromParsed} a ${toParsed}: ${error.message}`);
    }
  }
}