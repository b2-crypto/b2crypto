import { CacheModule, Logger, Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { databaseProviders } from './database-providers/database-providers.service';
import { IntegrationModule } from '@integration/integration';
import { PomeloSignatureInterceptor } from './interceptors/pomelo.signature.interceptor';
import { PomeloSignatureUtils } from './utils/pomelo.integration.process.signature';
import { PomeloHttpUtils } from './utils/pomelo.integration.process.http.utils';
import { PomeloCache } from '@integration/integration/util/pomelo.integration.process.cache';
import { PomeloProcessConstants } from './utils/pomelo.integration.process.constants';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { IntegrationServiceModule } from 'apps/integration-service/src/integration-service.module';
import { redisStore } from 'cache-manager-redis-store';
import { RedisClientOptions } from 'redis';

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule, IntegrationServiceModule],
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
        Logger.log(config, 'Redis Config');
        if (!config.password || !config.username) {
          return {
            ttl: parseInt(configService.get('CACHE_TTL') ?? '20') * 1000,
            max: parseInt(configService.get('CACHE_MAX_ITEMS') ?? '10'),
            isGlobal: true,
          };
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
