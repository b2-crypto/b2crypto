import { ActivityModule } from '@activity/activity';
import { BuildersModule } from '@builder/builders';
import { CommonModule } from '@common/common';
import { EnvironmentEnum } from '@common/common/enums/environment.enum';
import { ResponseHttpExceptionFilter } from '@common/common/exceptions/response.exception';
import { ResponseInterceptor } from '@common/common/interceptors/response.interceptor';
import { IProvider } from '@common/common/interfaces/i.provider.interface';
import configuration from '@config/config';
import { CacheInterceptor, CacheModule } from '@nestjs/cache-manager';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseB2CryptoModule } from '@response-b2crypto/response-b2crypto';
import { redisStore } from 'cache-manager-redis-store';
import { RedisClientOptions } from 'redis';
import { ActivityServiceController } from './activity-service.controller';
import { ActivityServiceService } from './activity-service.service';
import { ActivityServiceWebsocketGateway } from './activity-service.websocket.gateway';

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
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    CommonModule,
    BuildersModule,
    ActivityModule,
    ResponseB2CryptoModule,
  ],
  controllers: [ActivityServiceController],
  providers: [
    ActivityServiceService,
    ActivityServiceWebsocketGateway,
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: ResponseHttpExceptionFilter,
    },
  ] as IProvider[],
})
export class ActivityServiceModule {}
