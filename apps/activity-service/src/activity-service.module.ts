import { ActivityModule } from '@activity/activity';
import { DistributedCacheModule } from '@app/distributed-cache';
import { BuildersModule } from '@builder/builders';
import { CommonModule } from '@common/common';
import { ResponseHttpExceptionFilter } from '@common/common/exceptions/response.exception';
import { ResponseInterceptor } from '@common/common/interceptors/response.interceptor';
import { IProvider } from '@common/common/interfaces/i.provider.interface';
import configuration from '@config/config';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseB2CryptoModule } from '@response-b2crypto/response-b2crypto';
import { ActivityServiceController } from './activity-service.controller';
import { ActivityServiceService } from './activity-service.service';
import { ActivityServiceWebsocketGateway } from './activity-service.websocket.gateway';

@Module({
  imports: [
    DistributedCacheModule,
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
