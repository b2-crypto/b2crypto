import { AccountModule } from '@account/account/account.module';
import { AffiliateModule } from '@affiliate/affiliate';
import { DistributedCacheModule } from '@app/distributed-cache';
import { BuildersModule } from '@builder/builders';
import { CategoryModule } from '@category/category';
import { CrmModule } from '@crm/crm';
import {
  IntegrationModule,
  IntegrationService,
} from '@integration/integration';
import { LeadModule } from '@lead/lead';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { PspAccountModule } from '@psp-account/psp-account';
import { PspModule } from '@psp/psp';
import { StatusModule } from '@status/status';
import { TransferModule } from '@transfer/transfer';
import { AccountServiceService } from 'apps/account-service/src/account-service.service';
import { AffiliateServiceService } from 'apps/affiliate-service/src/affiliate-service.service';
import { CategoryServiceService } from 'apps/category-service/src/category-service.service';
import { PspServiceService } from 'apps/psp-service/src/psp-service.service';
import { PspAccountServiceService } from 'apps/psp-service/src/psp.account.service.service';
import { StatusServiceService } from 'apps/status-service/src/status-service.service';
import { TransferServiceController } from './transfer-service.controller';
import { TransferServiceService } from './transfer-service.service';
import { TransferServiceWebsocketGateway } from './transfer-service.websocket.gateway';

@Module({
  imports: [
    DistributedCacheModule,
    CrmModule,
    LeadModule,
    StatusModule,
    TransferModule,
    CategoryModule,
    BuildersModule,
    PspAccountModule,
    AccountModule,
    IntegrationModule,
    AffiliateModule,
    PspModule,
    HttpModule,
  ],
  controllers: [TransferServiceController],
  providers: [
    TransferServiceService,
    TransferServiceWebsocketGateway,
    IntegrationService,
    AccountServiceService,
    StatusServiceService,
    CategoryServiceService,
    PspAccountServiceService,
    AffiliateServiceService,
    //PspAccountServiceService,
    PspServiceService,
  ],
})
export class TransferServiceModule {}
