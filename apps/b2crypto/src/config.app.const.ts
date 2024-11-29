import { AuthModule } from '@auth/auth';
import { BuildersModule } from '@builder/builders';
import { ResponseHttpExceptionFilter } from '@common/common/exceptions/response.exception';
import { B2CryptoCacheInterceptor } from '@common/common/interceptors/b-2-crypto-cache.interceptor';
import { ResponseInterceptor } from '@common/common/interceptors/response.interceptor';
import { IProvider } from '@common/common/interfaces/i.provider.interface';
import { QueueAdminModule } from '@common/common/queue-admin-providers/queue.admin.provider.module';
import { CacheModule, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ResponseB2CryptoModule } from '@response-b2crypto/response-b2crypto';
import { AccountServiceModule } from 'apps/account-service/src/account-service.module';
import { ActivityServiceModule } from 'apps/activity-service/src/activity-service.module';
import { AffiliateServiceModule } from 'apps/affiliate-service/src/affiliate-service.module';
import { BrandServiceModule } from 'apps/brand-service/src/brand-service.module';
import { CategoryServiceModule } from 'apps/category-service/src/category-service.module';
import { CommunicationServiceModule } from 'apps/communication-service/src/communication-service.module';
import { CrmServiceModule } from 'apps/crm-service/src/crm-service.module';
import { FileServiceModule } from 'apps/file-service/src/file-service.module';
import { GroupServiceModule } from 'apps/group-service/src/group-service.module';
import { IntegrationServiceModule } from 'apps/integration-service/src/integration-service.module';
import { IpAddressServiceModule } from 'apps/ip-address-service/src/ip-address-service.module';
import { LeadServiceModule } from 'apps/lead-service/src/lead-service.module';
import { MessageServiceModule } from 'apps/message-service/src/message-service.module';
import { PermissionServiceModule } from 'apps/permission-service/src/permission-service.module';
import { PersonServiceModule } from 'apps/person-service/src/person-service.module';
import { PspServiceModule } from 'apps/psp-service/src/psp-service.module';
import { RoleServiceModule } from 'apps/role-service/src/role-service.module';
import { AuthServiceModule } from 'apps/auth-service/src/auth-service.module';
import { StatsServiceModule } from 'apps/stats-service/src/stats-service.module';
import { StatusServiceModule } from 'apps/status-service/src/status-service.module';
import { TrafficServiceModule } from 'apps/traffic-service/src/traffic-service.module';
import { TransferServiceModule } from 'apps/transfer-service/src/transfer-service.module';
import { UserServiceModule } from 'apps/user-service/src/user-service.module';
import * as redisStore from 'cache-manager-redis-store';
import configuration from 'config/configuration';
import { RedisClientOptions } from 'redis';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EnvironmentEnum } from '@common/common/enums/environment.enum';

export const configApp = {
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
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    BuildersModule,
    ResponseB2CryptoModule,
    // Services Privated
    AccountServiceModule,
    UserServiceModule,
    StatusServiceModule,
    RoleServiceModule,
    PersonServiceModule,
    PspServiceModule,
    PermissionServiceModule,
    MessageServiceModule,
    LeadServiceModule,
    IpAddressServiceModule,
    GroupServiceModule,
    FileServiceModule,
    CrmServiceModule,
    CategoryServiceModule,
    BrandServiceModule,
    AffiliateServiceModule,
    ActivityServiceModule,
    TrafficServiceModule,
    TransferServiceModule,
    AuthModule,
    // Servicies Public
    CommunicationServiceModule,
    AuthServiceModule,
    StatsServiceModule,
    QueueAdminModule,
    //SeedModule,
    IntegrationServiceModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: B2CryptoCacheInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: ResponseHttpExceptionFilter,
    },
  ] as IProvider[],
  exports: [],
};
