import { BuildersModule } from '@builder/builders';
import { EnvironmentEnum } from '@common/common/enums/environment.enum';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-store';
import { RedisClientOptions } from 'redis';
import { IntegrationService } from './integration.service';

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
    HttpModule,
    BuildersModule,
    HttpModule.registerAsync({
      useFactory: () => ({
        timeout: 5000,
        maxRedirects: 5,
      }),
    }),
  ],
  providers: [IntegrationService],
  exports: [IntegrationService],
})
export class IntegrationModule {}
