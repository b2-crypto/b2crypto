import { AuthModule } from '@auth/auth'; // Asegúrate de que esta ruta de importación sea correcta
import { BuildersModule } from '@builder/builders'; // Asegúrate de que esta ruta de importación sea correcta
import { EnvironmentEnum } from '@common/common/enums/environment.enum';
import { IntegrationModule } from '@integration/integration'; // Asegúrate de que esta ruta de importación sea correcta
import { CacheModule } from '@nestjs/cache-manager';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-store';
import { RedisClientOptions } from 'redis';
import { SecurityServiceController } from './security-service.controller';
import { SecurityServiceService } from './security-service.service';
@Module({
  imports: [
    BuildersModule,
    IntegrationModule,
    AuthModule,
    ConfigModule,
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
  ],
  controllers: [SecurityServiceController],
  providers: [SecurityServiceService],
})
export class SecurityServiceModule {}
