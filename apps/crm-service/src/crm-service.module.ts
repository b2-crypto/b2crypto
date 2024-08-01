import { BuildersModule } from '@builder/builders';
import { CrmModule } from '@crm/crm';
import { IntegrationModule } from '@integration/integration';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CrmServiceController } from './crm-service.controller';
import { CrmServiceService } from './crm-service.service';
import { IntegrationsServiceController } from './integrations-service.controller';

@Module({
  imports: [
    CrmModule,
    BuildersModule,
    IntegrationModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [CrmServiceController, IntegrationsServiceController],
  providers: [CrmServiceService],
})
export class CrmServiceModule {}
