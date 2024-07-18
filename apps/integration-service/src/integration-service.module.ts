import { AuthModule } from '@auth/auth';
import { BuildersService } from '@builder/builders';
import { CommonModule } from '@common/common';
import { Constants } from '@common/common/utils/pomelo.integration.process.constants';
import { HttpUtils } from '@common/common/utils/pomelo.integration.process.http.utils';
import { SignatureUtils } from '@common/common/utils/pomelo.integration.process.signature';
import { IntegrationModule } from '@integration/integration';
import { PomeloCache } from '@integration/integration/util/pomelo.integration.process.cache';
import { Module } from '@nestjs/common';
import { FiatIntegrationClient } from './clients/pomelo.fiat.integration.client';
import { IntegrationServiceService } from './integration-service.service';
import { PomeloIntegrationServiceController } from './pomelo.integration-service.controller';
import { PomeloIntegrationProcessService } from './services/pomelo.integration.process.service';

@Module({
  imports: [AuthModule, CommonModule, IntegrationModule],
  controllers: [PomeloIntegrationServiceController],
  providers: [
    Constants,
    HttpUtils,
    PomeloCache,
    SignatureUtils,
    BuildersService,
    FiatIntegrationClient,
    IntegrationServiceService,
    PomeloIntegrationProcessService,
  ],
})
export class IntegrationServiceModule {}
