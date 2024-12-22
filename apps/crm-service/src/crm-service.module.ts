import { BuildersModule } from '@builder/builders';
import { EnvironmentEnum } from '@common/common/enums/environment.enum';
import { CrmModule } from '@crm/crm';
import { IntegrationModule } from '@integration/integration';
import { CacheModule } from '@nestjs/cache-manager';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { redisStore } from 'cache-manager-redis-store';
import { RedisClientOptions } from 'redis';
import { CrmServiceController } from './crm-service.controller';
import { CrmServiceService } from './crm-service.service';
import { IntegrationsServiceController } from './integrations-service.controller';

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
    BuildersModule,
    IntegrationModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [CrmServiceController, IntegrationsServiceController],
  providers: [CrmServiceService],
})
export class CrmServiceModule {}
