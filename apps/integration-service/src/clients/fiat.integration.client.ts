import { Traceable } from '@amplication/opentelemetry-nestjs';
import { Injectable, Inject } from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { TrmResponse, TrmResult } from '../interfaces/trm.interfaces';
import { ConfigService } from '@nestjs/config';



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
    this.initializeTrm();
    this.TRM_API_URL = configService.getOrThrow('TRM_ENDPOINT')
  }

  private async initializeTrm(): Promise<void> {
    try {
      const result = await this.updateTrmRate();
      this.logger.info(`[initializeTrm] TRM inicial obtenida desde ${result.source}: ${result.value}`);
    } catch (error) {
      this.logger.error(`[initializeTrm] Error al obtener TRM inicial: ${error.message || error}`);
    }
  }

  private async updateTrmRate(): Promise<TrmResult> {
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
      const cachedTrm = await this.getTrmFromCache();

      if (cachedTrm) {
        this.trmCopUsd = cachedTrm;
        this.trmLastUpdated = new Date();
        this.logger.info(`[updateTrmRate] TRM obtenida de cache: COP/USD = ${this.trmCopUsd}`);

        return {
          value: this.trmCopUsd,
          source: 'cache',
          updated: true,
          timestamp: this.trmLastUpdated
        };
      }

      const trmValue = await this.fetchTrmFromApi();

      if (trmValue) {
        this.trmCopUsd = trmValue;
        this.trmLastUpdated = new Date();


        this.logger.info(`[updateTrmRate] TRM actualizada desde API y guardada en cache: COP/USD = ${this.trmCopUsd}`);

        return {
          value: this.trmCopUsd,
          source: 'api',
          updated: true,
          timestamp: this.trmLastUpdated
        };
      }

      this.logger.warn(`[updateTrmRate] No se pudo obtener TRM nueva, usando valor por defecto: ${this.trmCopUsd}`);

      return {
        value: this.trmCopUsd,
        source: 'default',
        updated: false,
        timestamp: this.trmLastUpdated
      };
    } catch (error) {
      this.logger.error(`[updateTrmRate] Error actualizando TRM: ${error.message || error}`);

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

  private async fetchTrmFromApi(): Promise<number | null> {
    try {
      const payload = {
        currency: "COP",
        createdAtTimezone: "America/Bogota"
      };

      const response = await firstValueFrom(
        this.httpService.post<TrmResponse>(this.TRM_API_URL, payload)
      );

      if (response.data && response.data.value) {
        this.logger.info(`[fetchTrmFromApi] TRM obtenida de API: ${response.data.value}`);
        return response.data.value;
      }

      return null;
    } catch (error) {
      this.logger.error(`[fetchTrmFromApi] Error al obtener TRM de API: ${error.message || error}`);
      return null;
    }
  }

  private async getTrmFromCache(): Promise<number | null> {
    try {
      return await this.cacheManager.get<number>(this.TRM_CACHE_KEY);
    } catch (error) {
      this.logger.error(`[getTrmFromCache] Error al obtener TRM de caché: ${error.message || error}`);
      return null;
    }
  }

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
    const toParsed = to === 'USDT' ? 'USD' : to;
    const fromParsed = from === 'USDT' ? 'USD' : from;

    this.logger.info(`[getCurrencyConversion] Conversión de ${fromParsed} a ${toParsed} por ${amount}`);

    if (fromParsed === 'USD') return amount;

    try {
      const trmResult = await this.updateTrmRate();

      if (!trmResult.updated) {
        this.logger.warn(`[getCurrencyConversion] Usando TRM posiblemente obsoleta (${trmResult.source}): ${this.trmCopUsd}`);
      }

      const rates = new Map<string, number>([['COPUSD', this.trmCopUsd]]);
      const rate = rates.get(fromParsed + toParsed);

      if (!rate) {
        throw new Error(`Tasa de conversión no encontrada para ${fromParsed} a ${toParsed}`);
      }

      const swapFactory = (amount: number, rate: number) => amount / rate;
      const result = swapFactory(amount, rate);

      this.logger.info(`[getCurrencyConversion] Usando tasa: ${rate}, resultado: ${result}`);
      return result;
    } catch (error) {
      this.logger.error(`[getCurrencyConversion] Error en conversión de moneda: ${error.message || error}`);
      throw new Error(`Error al realizar conversión de ${fromParsed} a ${toParsed}: ${error.message}`);
    }
  }
}