import { AccountModule } from '@account/account/account.module';
import { AffiliateModule } from '@affiliate/affiliate';
import { BuildersModule } from '@builder/builders';
import { CategoryModule } from '@category/category';
import { EnvironmentEnum } from '@common/common/enums/environment.enum';
import { CrmModule } from '@crm/crm';
import {
  IntegrationModule,
  IntegrationService,
} from '@integration/integration';
import { LeadModule } from '@lead/lead';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PspAccountModule } from '@psp-account/psp-account';
import { PspModule } from '@psp/psp';
import { StatusModule } from '@status/status';
import { TransferModule } from '@transfer/transfer';
import { AccountServiceService } from 'apps/account-service/src/account-service.service';
import { AffiliateServiceService } from 'apps/affiliate-service/src/affiliate-service.service';
import { CategoryServiceService } from 'apps/category-service/src/category-service.service';
import { PspServiceService } from 'apps/psp-service/src/psp-service.service';
import { PspAccountServiceService } from 'apps/psp-service/src/psp.account.service.service';
import { StatusServiceService } from 'apps/status-service/src/status-service.service';
import { redisStore } from 'cache-manager-redis-store';
import { RedisClientOptions } from 'redis';
import { TransferServiceController } from './transfer-service.controller';
import { TransferServiceService } from './transfer-service.service';
import { TransferServiceWebsocketGateway } from './transfer-service.websocket.gateway';

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
    CrmModule,
    LeadModule,
    StatusModule,
    TransferModule,
    CategoryModule,
    BuildersModule,
    PspAccountModule,
    AccountModule,
    IntegrationModule,
    AffiliateModule,
    PspModule,
    HttpModule,
  ],
  controllers: [TransferServiceController],
  providers: [
    TransferServiceService,
    TransferServiceWebsocketGateway,
    IntegrationService,
    AccountServiceService,
    StatusServiceService,
    CategoryServiceService,
    PspAccountServiceService,
    AffiliateServiceService,
    //PspAccountServiceService,
    PspServiceService,
  ],
})
export class TransferServiceModule {}
