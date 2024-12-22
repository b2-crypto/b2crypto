import { AuthModule } from '@auth/auth';
import { BuildersModule } from '@builder/builders';
import { EnvironmentEnum } from '@common/common/enums/environment.enum';
import { IntegrationModule } from '@integration/integration';
import { CacheModule } from '@nestjs/cache-manager';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from '@user/user';
import { AuthServiceController } from 'apps/auth-service/src/auth-service.controller';
import { redisStore } from 'cache-manager-redis-store';
import { RedisClientOptions } from 'redis';
import { UserServiceController } from './user-service.controller';
import { UserServiceService } from './user-service.service';

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
    UserModule,
    BuildersModule,
    AuthModule,
    IntegrationModule,
  ],
  controllers: [UserServiceController, AuthServiceController],
  providers: [UserServiceService],
})
export class UserServiceModule {}
