import { AccountModule } from '@account/account/account.module';
import { BuildersModule } from '@builder/builders';
import { CategoryModule } from '@category/category';
import { CommonModule } from '@common/common';
import { ResponseHttpExceptionFilter } from '@common/common/exceptions/response.exception';
import { ResponseInterceptor } from '@common/common/interceptors/response.interceptor';
import { IProvider } from '@common/common/interfaces/i.provider.interface';
import configuration from '@config/config';
import { GroupModule } from '@group/group';
import {
  IntegrationModule,
  IntegrationService,
} from '@integration/integration';
import { CacheInterceptor, CacheModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseB2CryptoModule } from '@response-b2crypto/response-b2crypto';
import { StatusModule } from '@status/status';
import { UserModule } from '@user/user';
import { CategoryServiceService } from 'apps/category-service/src/category-service.service';
import { GroupServiceService } from 'apps/group-service/src/group-service.service';
import { StatusServiceService } from 'apps/status-service/src/status-service.service';
import { UserServiceService } from 'apps/user-service/src/user-service.service';
import { AccountServiceController } from './account-service.controller';
import { AccountServiceService } from './account-service.service';
import { CardServiceController } from './card-service.controller';
import { WalletServiceController } from './wallet-service.controller';
import { FiatIntegrationClient } from 'apps/integration-service/src/clients/fiat.integration.client';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      ttl: 10,
      max: 5,
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
  ] as IProvider[],
})
export class AccountServiceModule {}
