import { AccountModule } from '@account/account/account.module';
import { AuthModule } from '@auth/auth';
import { BuildersModule } from '@builder/builders';
import { CommonModule } from '@common/common';
import { Constants } from '@common/common/utils/pomelo.integration.process.constants';
import { HttpUtils } from '@common/common/utils/pomelo.integration.process.http.utils';
import { SignatureUtils } from '@common/common/utils/pomelo.integration.process.signature';
import { SumsubHttpUtils } from '@common/common/utils/sumsub.integration.process.http.utils';
import { SumsubSignatureUtils } from '@common/common/utils/sumsub.integration.process.signature';
import { IntegrationModule } from '@integration/integration';
import { PomeloRestClient } from '@integration/integration/client/pomelo.integration.client';
import { PomeloCache } from '@integration/integration/util/pomelo.integration.process.cache';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { UserModule } from '@user/user';
import { AccountServiceService } from 'apps/account-service/src/account-service.service';
import { UserServiceService } from 'apps/user-service/src/user-service.service';
import { FiatIntegrationClient } from './clients/fiat.integration.client';
import { IntegrationServiceService } from './integration-service.service';
import { PomeloIntegrationServiceController } from './pomelo.integration-service.controller';
import { PomeloSensitiveInfoController } from './pomelo.sensitive-info.controller';
import { PomeloShippingController } from './pomelo.shipping.controller';
import { PomeloIntegrationProcessService } from './services/pomelo.integration.process.service';
import { PomeloIntegrationShippingService } from './services/pomelo.integration.shipping.service';
import { SumsubNotificationIntegrationService } from './services/sumsub.notification.integration.service';
import { PomeloMigrationController } from './pomelo.migration.controller';
import { PomeloMigrationService } from './services/pomelo.migration.service';
import { V1DBClient } from './clients/pomelo.v1.bd.client';
import { SumsubNotificationIntegrationController } from './sumsub.notification.controller';
import { MulterModule } from '@nestjs/platform-express';
import { FileModule } from '@file/file';
import { B2CoreMigrationController } from './b2core.migration.controller';
import { B2CoreMigrationService } from './services/b2core.migration.service';

@Module({
  imports: [
    MulterModule.register({
      dest: './migration/files',
    }),
    FileModule,
    AuthModule,
    CommonModule,
    AccountModule,
    IntegrationModule,
    BuildersModule,
    UserModule,
    HttpModule,
  ],
  controllers: [
    SumsubNotificationIntegrationController,
    PomeloIntegrationServiceController,
    PomeloSensitiveInfoController,
    B2CoreMigrationController,
    PomeloShippingController,
    PomeloMigrationController,
  ],
  providers: [
    Constants,
    HttpUtils,
    V1DBClient,
    PomeloCache,
    SignatureUtils,
    PomeloRestClient,
    AccountServiceService,
    UserServiceService,
    FiatIntegrationClient,
    PomeloMigrationService,
    B2CoreMigrationService,
    IntegrationServiceService,
    PomeloIntegrationProcessService,
    PomeloIntegrationShippingService,
    SumsubHttpUtils,
    SumsubSignatureUtils,
    SumsubNotificationIntegrationService,
  ],
})
export class IntegrationServiceModule {}
