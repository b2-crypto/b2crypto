import { Module } from '@nestjs/common';
import { PomeloIntegrationServiceController } from './pomelo.integration-service.controller';
import { IntegrationServiceService } from './integration-service.service';
import { Constants } from './utils/pomelo.integration.process.constants';
import { SignatureUtils } from './utils/pomelo.integration.process.signature';
import { HttpUtils } from './utils/pomelo.integration.process.http.utils';
import { AuthModule } from '@auth/auth';
import { CommonModule } from '@common/common';

@Module({
  imports: [AuthModule, CommonModule],
  controllers: [PomeloIntegrationServiceController],
  providers: [IntegrationServiceService, Constants, SignatureUtils, HttpUtils],
})
export class IntegrationServiceModule {}
