import { AffiliateModule } from '@affiliate/affiliate';
import { BuildersModule } from '@builder/builders';
import { BrandModule } from 'libs/brand/src';
import { CategoryModule } from '@category/category';
import { CommonModule } from '@common/common';
import { CrmModule } from '@crm/crm';
import { LeadPspServiceMongooseService } from '@lead/lead/lead-psp-service-mongoose.service';
import { LeadServiceMongooseService } from '@lead/lead/lead-service-mongoose.service';
import { Module } from '@nestjs/common';
import { PersonModule } from '@person/person';
import { PspAccountModule } from '@psp-account/psp-account';
import { ResponseB2CryptoModule } from '@response-b2crypto/response-b2crypto';
import { StatusModule } from '@status/status';
import { TransferModule } from '@transfer/transfer';
import { UserModule } from '@user/user';
import { leadProviders } from './providers/lead.providers';

@Module({
  imports: [
    UserModule,
    CrmModule,
    CommonModule,
    StatusModule,
    PersonModule,
    PspAccountModule,
    TransferModule,
    //TrafficModule,
    BuildersModule,
    CategoryModule,
    AffiliateModule,
    BrandModule,
    ResponseB2CryptoModule,
  ],
  providers: [
    LeadServiceMongooseService,
    LeadPspServiceMongooseService,
    ...leadProviders,
  ],
  exports: [
    LeadServiceMongooseService,
    LeadPspServiceMongooseService,
    ...leadProviders,
  ],
})
export class LeadModule {}
