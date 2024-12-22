import { AccountModule } from '@account/account/account.module';
import { DistributedCacheModule } from '@app/distributed-cache';
import { AuthModule } from '@auth/auth';
import { BuildersModule } from '@builder/builders';
import { CommonModule } from '@common/common';
import { PomeloProcessConstants } from '@common/common/utils/pomelo.integration.process.constants';
import { PomeloHttpUtils } from '@common/common/utils/pomelo.integration.process.http.utils';
import { PomeloSignatureUtils } from '@common/common/utils/pomelo.integration.process.signature';
import { SumsubHttpUtils } from '@common/common/utils/sumsub.integration.process.http.utils';
import { SumsubSignatureUtils } from '@common/common/utils/sumsub.integration.process.signature';
import { FileModule } from '@file/file';
import { IntegrationModule } from '@integration/integration';
import { PomeloRestClient } from '@integration/integration/client/pomelo.integration.client';
import { PomeloCache } from '@integration/integration/util/pomelo.integration.process.cache';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ResponseB2CryptoService } from '@response-b2crypto/response-b2crypto';
import { UserModule } from '@user/user';
import { AccountServiceService } from 'apps/account-service/src/account-service.service';
import { UserServiceService } from 'apps/user-service/src/user-service.service';
import { B2BinPayNotificationsController } from './b2binpay.notifications.controller';
import { B2CoreMigrationController } from './b2core.migration.controller';
import { ClientsIntegrationController } from './clients.controller';
import { FiatIntegrationClient } from './clients/fiat.integration.client';
import { PomeloV1DBClient } from './clients/pomelo.v1.bd.client';
import { IntegrationServiceService } from './integration-service.service';
import { PomeloIntegrationServiceController } from './pomelo.integration-service.controller';
import { PomeloMigrationController } from './pomelo.migration.controller';
import { PomeloSensitiveInfoController } from './pomelo.sensitive-info.controller';
import { PomeloShippingController } from './pomelo.shipping.controller';
import { B2CoreMigrationService } from './services/b2core.migration.service';
import { PomeloIntegrationProcessService } from './services/pomelo.integration.process.service';
import { PomeloIntegrationSFTPService } from './services/pomelo.integration.sftp.service';
import { PomeloIntegrationShippingService } from './services/pomelo.integration.shipping.service';
import { PomeloMigrationService } from './services/pomelo.migration.service';
import { SumsubNotificationIntegrationService } from './services/sumsub.notification.integration.service';
import { SumsubNotificationIntegrationController } from './sumsub.notification.controller';

@Module({
  imports: [
    DistributedCacheModule,
    MulterModule.register({
      dest: './upload',
    }),
    FileModule,
    AuthModule,
    UserModule,
    HttpModule,
    CommonModule,
    AccountModule,
    BuildersModule,
    IntegrationModule,
  ],
  controllers: [
    SumsubNotificationIntegrationController,
    B2BinPayNotificationsController,
    ClientsIntegrationController,
    PomeloIntegrationServiceController,
    PomeloSensitiveInfoController,
    B2CoreMigrationController,
    PomeloShippingController,
    PomeloMigrationController,
  ],
  providers: [
    PomeloV1DBClient,
    PomeloCache,
    PomeloSignatureUtils,
    PomeloHttpUtils,
    SumsubHttpUtils,
    PomeloRestClient,
    UserServiceService,
    SumsubSignatureUtils,
    FiatIntegrationClient,
    PomeloMigrationService,
    B2CoreMigrationService,
    AccountServiceService,
    PomeloProcessConstants,
    IntegrationServiceService,
    PomeloIntegrationSFTPService,
    PomeloIntegrationProcessService,
    PomeloIntegrationShippingService,
    SumsubNotificationIntegrationService,
    ResponseB2CryptoService,
  ],
})
export class IntegrationServiceModule {}
