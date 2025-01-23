import {
  Cache,
  CACHE_MANAGER,
  CacheModule,
  CacheStore,
} from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';

@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const store = await redisStore({
          username: configService.getOrThrow('REDIS_USERNAME'),
          password: configService.getOrThrow('REDIS_PASSWORD'),
          ttl: parseInt(configService.getOrThrow('CACHE_TTL') ?? '3') * 1000,
          socket: {
            host: configService.getOrThrow('REDIS_HOST'),
            port: configService.getOrThrow<number>('REDIS_PORT'),
          },
        });

        return {
          store: store as unknown as CacheStore,
          isGlobal: true,
        };
      },
      inject: [ConfigService],
    }),
  ],
  providers: [{ provide: CACHE_MANAGER, useExisting: Cache }],
  exports: [{ provide: CACHE_MANAGER, useExisting: Cache }],
})
export class DistributedCacheModule {}
