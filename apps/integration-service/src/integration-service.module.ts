import { AuthModule } from '@auth/auth';
import { BuildersModule, BuildersService } from '@builder/builders';
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
import { HttpModule } from '@nestjs/axios';
import { PomeloSensitiveInfoController } from './pomelo.sensitive-info.controller';
import { PomeloRestClient } from '@integration/integration/client/pomelo.integration.client';
import { AccountModule } from '@account/account/account.module';
import { AccountServiceService } from 'apps/account-service/src/account-service.service';

@Module({
  imports: [
    AuthModule,
    CommonModule,
    AccountModule,
    IntegrationModule,
    BuildersModule,
    HttpModule,
  ],
  controllers: [
    PomeloIntegrationServiceController,
    PomeloSensitiveInfoController,
  ],
  providers: [
    Constants,
    HttpUtils,
    PomeloCache,
    SignatureUtils,
    PomeloRestClient,
    AccountServiceService,
    FiatIntegrationClient,
    IntegrationServiceService,
    PomeloIntegrationProcessService,
  ],
})
export class IntegrationServiceModule {}
