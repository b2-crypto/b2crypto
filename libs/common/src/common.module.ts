import { IntegrationModule } from '@integration/integration';
import { PomeloCache } from '@integration/integration/util/pomelo.integration.process.cache';
import { CacheModule } from '@nestjs/cache-manager';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-store';
import { RedisClientOptions } from 'redis';
import { CommonService } from './common.service';
import { databaseProviders } from './database-providers/database-providers.service';
import { EnvironmentEnum } from './enums/environment.enum';
import { PomeloSignatureInterceptor } from './interceptors/pomelo.signature.interceptor';
import { PomeloProcessConstants } from './utils/pomelo.integration.process.constants';
import { PomeloHttpUtils } from './utils/pomelo.integration.process.http.utils';
import { PomeloSignatureUtils } from './utils/pomelo.integration.process.signature';

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const config = {
          store: redisStore,
          username: configService.get('REDIS_USERNAME') ?? '',
          password: configService.get('REDIS_PASSWORD') ?? '',
          host: configService.get('REDIS_HOST') ?? 'localhost',
          port: configService.get('REDIS_PORT') ?? 6379,
          ttl: parseInt(configService.get('CACHE_TTL') ?? '20') * 1000,
          max: parseInt(configService.get('CACHE_MAX_ITEMS') ?? '10'),
          isGlobal: true,
        } as RedisClientOptions;
        if (configService.get('ENVIRONMENT') !== EnvironmentEnum.prod) {
          Logger.log(config, 'Redis Config');
        }
        return config;
      },
      inject: [ConfigService],
    }),
  ],
  providers: [
    PomeloCache,
    CommonService,
    PomeloHttpUtils,
    IntegrationModule,
    PomeloSignatureUtils,
    ...databaseProviders,
    PomeloProcessConstants,
    PomeloSignatureInterceptor,
  ],
  exports: [
    CommonService,
    PomeloHttpUtils,
    ...databaseProviders,
    PomeloSignatureInterceptor,
  ],
})
export class CommonModule {}
