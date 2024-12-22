import {
  AffiliateModule,
  AffiliateServiceMongooseService,
} from '@affiliate/affiliate';
import { AuthService } from '@auth/auth/auth.service';
import { jwtConstants } from '@auth/auth/constants/auth.constant';
import { BrandModule, BrandServiceMongooseService } from '@brand/brand';
import { BuildersModule } from '@builder/builders';
import { EnvironmentEnum } from '@common/common/enums/environment.enum';
import { CrmModule, CrmServiceMongooseService } from '@crm/crm';
import {
  IpAddressModule,
  IpAddressServiceMongooseService,
} from '@ip-address/ip-address';
import { CacheModule } from '@nestjs/cache-manager';
import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import {
  PermissionModule,
  PermissionServiceMongooseService,
} from '@permission/permission';
import { PersonModule, PersonServiceMongooseService } from '@person/person';
import { RoleModule } from '@role/role';
import { TrafficModule, TrafficServiceMongooseService } from '@traffic/traffic';
import { UserModule, UserServiceMongooseService } from '@user/user';
import { redisStore } from 'cache-manager-redis-store';
import { RedisClientOptions } from 'redis';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '60m' },
    }),
    ConfigModule,
    BuildersModule,
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
    UserModule,
    RoleModule,
    PermissionModule,
    AffiliateModule,
    IpAddressModule,
    BrandModule,
    TrafficModule,
    PersonModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: {
        expiresIn: jwtConstants.expiresIn,
      },
    }),
  ],
  providers: [
    AuthService,
    CrmServiceMongooseService,
    TrafficServiceMongooseService,
    BrandServiceMongooseService,
    IpAddressServiceMongooseService,
    UserServiceMongooseService,
    PermissionServiceMongooseService,
    AffiliateServiceMongooseService,
    PersonServiceMongooseService,
  ],
  exports: [AuthService],
})
export class AuthServiceModule {}
