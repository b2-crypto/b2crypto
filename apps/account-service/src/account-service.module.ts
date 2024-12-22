import { AccountModule } from '@account/account/account.module';
import { BuildersModule } from '@builder/builders';
import { CategoryModule } from '@category/category';
import { CommonModule } from '@common/common';
import { EnvironmentEnum } from '@common/common/enums/environment.enum';
import { ResponseHttpExceptionFilter } from '@common/common/exceptions/response.exception';
import { ResponseInterceptor } from '@common/common/interceptors/response.interceptor';
import { IProvider } from '@common/common/interfaces/i.provider.interface';
import configuration from '@config/config';
import { GroupModule } from '@group/group';
import {
  IntegrationModule,
  IntegrationService,
} from '@integration/integration';
import { HttpModule } from '@nestjs/axios';
import { CacheInterceptor, CacheModule } from '@nestjs/cache-manager';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseB2CryptoModule } from '@response-b2crypto/response-b2crypto';
import { StatusModule } from '@status/status';
import { UserModule } from '@user/user';
import { CategoryServiceService } from 'apps/category-service/src/category-service.service';
import { GroupServiceService } from 'apps/group-service/src/group-service.service';
import { FiatIntegrationClient } from 'apps/integration-service/src/clients/fiat.integration.client';
import { StatusServiceService } from 'apps/status-service/src/status-service.service';
import { UserServiceService } from 'apps/user-service/src/user-service.service';
import { redisStore } from 'cache-manager-redis-store';
import { RedisClientOptions } from 'redis';
import { AccountServiceController } from './account-service.controller';
import { AccountServiceService } from './account-service.service';
import { CardServiceController } from './card-service.controller';
import { WalletServiceController } from './wallet-service.controller';
import { WalletServiceService } from './wallet-service.service';

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
    AccountModule,
    ResponseB2CryptoModule,
    IntegrationModule,
    //
    UserModule,
    GroupModule,
    CategoryModule,
    StatusModule,
    //
    HttpModule,
  ],
  controllers: [
    AccountServiceController,
    CardServiceController,
    WalletServiceController,
  ],
  providers: [
    WalletServiceService,
    StatusServiceService,
    CategoryServiceService,
    GroupServiceService,
    UserServiceService,
    //
    FiatIntegrationClient,
    IntegrationService,
    AccountServiceService,
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
    WalletServiceService,
  ] as IProvider[],
})
export class AccountServiceModule {}
