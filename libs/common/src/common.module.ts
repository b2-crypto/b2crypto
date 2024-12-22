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
          username: configService.getOrThrow('REDIS_USERNAME'),
          password: configService.getOrThrow('REDIS_PASSWORD'),
          host: configService.getOrThrow('REDIS_HOST'),
          port: configService.getOrThrow<number>('REDIS_PORT'),
          ttl: parseInt(configService.getOrThrow('CACHE_TTL') ?? '20') * 1000,
          max: parseInt(configService.getOrThrow('CACHE_MAX_ITEMS')),
          isGlobal: true,
        } as RedisClientOptions;
        if (configService.getOrThrow('ENVIRONMENT') !== EnvironmentEnum.prod) {
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
