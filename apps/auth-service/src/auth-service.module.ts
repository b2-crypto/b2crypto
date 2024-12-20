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
