import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { BuildersModule } from '@builder/builders';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthService } from '@auth/auth/auth.service';
import { CrmModule, CrmServiceMongooseService } from '@crm/crm';
import { UserModule, UserServiceMongooseService } from '@user/user';
import { PermissionModule, PermissionServiceMongooseService } from '@permission/permission';
import { AffiliateModule, AffiliateServiceMongooseService } from '@affiliate/affiliate';
import { RoleModule } from '@role/role';
import { PersonModule, PersonServiceMongooseService } from '@person/person';
import { IpAddressModule, IpAddressServiceMongooseService } from '@ip-address/ip-address';
import { BrandModule, BrandServiceMongooseService } from '@brand/brand';
import { TrafficModule, TrafficServiceMongooseService } from '@traffic/traffic';
import { jwtConstants } from '@auth/auth/constants/auth.constant';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '60m' },
    }),
    ConfigModule,
    BuildersModule,
    CacheModule.register(),
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
  providers: [AuthService, CrmServiceMongooseService, TrafficServiceMongooseService, BrandServiceMongooseService, IpAddressServiceMongooseService, UserServiceMongooseService, PermissionServiceMongooseService, AffiliateServiceMongooseService, PersonServiceMongooseService],
  exports: [AuthService]
})
export class AuthServiceModule { }