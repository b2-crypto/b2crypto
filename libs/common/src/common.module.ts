import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { databaseProviders } from './database-providers/database-providers.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from 'config/configuration';
import { IntegrationModule } from '@integration/integration';
import { SignatureUtils } from 'apps/integration-service/src/utils/pomelo.integration.process.signature';
import { HttpUtils } from 'apps/integration-service/src/utils/pomelo.integration.process.http.utils';
import { SignatureInterceptor } from './interceptors/pomelo.signature.interceptor';

@Module({
  providers: [
    CommonService,
    ...databaseProviders,
    IntegrationModule,
    SignatureUtils,
    HttpUtils,
  ],
  exports: [CommonService, ...databaseProviders, SignatureInterceptor],
})
export class CommonModule {}
