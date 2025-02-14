import {
  AffiliateModule,
  AffiliateServiceMongooseService,
} from '@affiliate/affiliate';
import { DistributedCacheModule } from '@app/distributed-cache';
import { AuthService } from '@auth/auth/auth.service';
import { BrandModule, BrandServiceMongooseService } from '@brand/brand';
import { BuildersModule } from '@builder/builders';
import { CrmModule, CrmServiceMongooseService } from '@crm/crm';
import {
  IpAddressModule,
  IpAddressServiceMongooseService,
} from '@ip-address/ip-address';
import { Module } from '@nestjs/common';
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

@Module({
  imports: [
    ConfigModule,
    BuildersModule,
    DistributedCacheModule,
    CrmModule,
    UserModule,
    RoleModule,
    PermissionModule,
    AffiliateModule,
    IpAddressModule,
    BrandModule,
    TrafficModule,
    PersonModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow('AUTH_SECRET'),
        signOptions: {
          expiresIn: configService.getOrThrow('AUTH_EXPIRE_IN'),
        },
      })
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
export class AuthServiceModule { }
