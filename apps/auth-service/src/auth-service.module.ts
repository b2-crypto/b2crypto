import {
  AffiliateModule,
  AffiliateServiceMongooseService,
} from '@affiliate/affiliate';
import { DistributedCacheModule } from '@app/distributed-cache';
import { AuthService } from '@auth/auth/auth.service';
import { jwtConstants } from '@auth/auth/constants/auth.constant';
import { BrandModule, BrandServiceMongooseService } from '@brand/brand';
import { BuildersModule } from '@builder/builders';
import { CrmModule, CrmServiceMongooseService } from '@crm/crm';
import {
  IpAddressModule,
  IpAddressServiceMongooseService,
} from '@ip-address/ip-address';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '60m' },
    }),
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
