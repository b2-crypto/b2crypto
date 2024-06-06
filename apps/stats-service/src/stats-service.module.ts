import { AffiliateModule } from '@affiliate/affiliate';
import { BuildersModule } from '@builder/builders';
import { BrandModule } from 'libs/brand/src';
import { CrmModule } from '@crm/crm';
import { Module } from '@nestjs/common';
import { StatsModule } from '@stats/stats';
import { StatsServiceController } from './stats-service.controller';
import { StatsServiceService } from './stats-service.service';
import { StatsPspAccountServiceWebsocketGateway } from './stats-psp-account-service.websocket.gateway';
import { StatsAffiliateServiceWebsocketGateway } from './stats-affiliate-service.websocket.gateway';
import { StatsPspAccountServiceService } from './stats-psp-account-service.service';
import { StatsAffiliateServiceService } from './stats-affiliate-service.service';

@Module({
  imports: [
    CrmModule,
    AffiliateModule,
    BrandModule,
    StatsModule,
    BuildersModule,
  ],
  controllers: [StatsServiceController],
  providers: [
    StatsServiceService,
    StatsAffiliateServiceService,
    StatsPspAccountServiceService,
    StatsAffiliateServiceWebsocketGateway,
    StatsPspAccountServiceWebsocketGateway,
  ],
})
export class StatsServiceModule {}
