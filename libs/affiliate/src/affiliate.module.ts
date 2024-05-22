import { AffiliateServiceMongooseService } from '@affiliate/affiliate/affiliate-service-mongoose.service';
import { BrandModule } from 'libs/brand/src';
import { CommonModule } from '@common/common';
import { CrmModule } from '@crm/crm';
import { GroupModule } from '@group/group';
import { IpAddressModule } from '@ip-address/ip-address';
import { Module } from '@nestjs/common';
import { PersonModule } from '@person/person';
import { ResponseB2CryptoModule } from '@response-b2crypto/response-b2crypto';
import { TrafficModule } from '@traffic/traffic';
import { UserModule } from '@user/user';
import { affiliateProviders } from './infrastructure/mongoose/affiliate.providers';

@Module({
  imports: [
    CrmModule,
    UserModule,
    GroupModule,
    PersonModule,
    CommonModule,
    TrafficModule,
    IpAddressModule,
    BrandModule,
    ResponseB2CryptoModule,
  ],
  providers: [AffiliateServiceMongooseService, ...affiliateProviders],
  exports: [AffiliateServiceMongooseService, ...affiliateProviders],
})
export class AffiliateModule {}
