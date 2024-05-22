import { AccountModule } from '@account/account/account.module';
import { BuildersModule } from '@builder/builders';
import { CommonModule } from '@common/common';
import { ResponseHttpExceptionFilter } from '@common/common/exceptions/response.exception';
import { ResponseInterceptor } from '@common/common/interceptors/response.interceptor';
import { IProvider } from '@common/common/interfaces/i.provider.interface';
import { QueueAdminModule } from '@common/common/queue-admin-providers/queue.admin.provider.module';
import configuration from '@config/config';
import { CacheInterceptor, CacheModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseB2CryptoModule } from '@response-b2crypto/response-b2crypto';
import { AccountServiceController } from './account-service.controller';
import { AccountServiceService } from './account-service.service';
import { CardServiceController } from './card-service.controller';
import { IntegrationModule, IntegrationService } from '@integration/integration';

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
    QueueAdminModule,
    ResponseB2CryptoModule,
    IntegrationModule,
  ],
  controllers: [AccountServiceController, CardServiceController],
  providers: [
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
