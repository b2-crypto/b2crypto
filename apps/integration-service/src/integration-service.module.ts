import { Module } from '@nestjs/common';
import { PomeloIntegrationServiceController } from './pomelo.integration-service.controller';
import { IntegrationServiceService } from './integration-service.service';
import { AuthModule } from '@auth/auth';
import { CommonModule } from '@common/common';
import { PomeloCache } from './clients/pomelo.integration.process.cache';
import { Constants } from '@common/common/utils/pomelo.integration.process.constants';
import { SignatureUtils } from '@common/common/utils/pomelo.integration.process.signature';
import { HttpUtils } from '@common/common/utils/pomelo.integration.process.http.utils';
import { IntegrationModule } from '@integration/integration';

@Module({
  imports: [AuthModule, CommonModule, IntegrationModule],
  controllers: [PomeloIntegrationServiceController],
  providers: [
    IntegrationServiceService,
    Constants,
    SignatureUtils,
    HttpUtils,
    PomeloCache,
  ],
})
export class IntegrationServiceModule {}
