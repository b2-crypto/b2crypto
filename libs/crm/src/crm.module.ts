import { BrandModule } from 'libs/brand/src';
import { CategoryModule } from '@category/category';
import { CommonModule } from '@common/common';
import { CrmServiceMongooseService } from '@crm/crm/crm-service-mongoose.service';
import { GroupModule } from '@group/group';
import { IpAddressModule } from '@ip-address/ip-address';
import { Module } from '@nestjs/common';
import { PersonModule } from '@person/person';
import { PspModule } from '@psp/psp';
import { ResponseB2CryptoModule } from '@response-b2crypto/response-b2crypto';
import { StatusModule } from '@status/status';
import { TrafficModule } from '@traffic/traffic';
import { crmProviders } from './providers/crm.providers';

@Module({
  imports: [
    CommonModule,
    CrmModule,
    PspModule,
    StatusModule,
    GroupModule,
    CategoryModule,
    PersonModule,
    CommonModule,
    TrafficModule,
    IpAddressModule,
    BrandModule,
    ResponseB2CryptoModule,
  ],
  providers: [CrmServiceMongooseService, ...crmProviders],
  exports: [CrmServiceMongooseService, ...crmProviders],
})
export class CrmModule {}
