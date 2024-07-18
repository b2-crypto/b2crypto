import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { databaseProviders } from './database-providers/database-providers.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from 'config/configuration';
import { IntegrationModule } from '@integration/integration';
import { SignatureInterceptor } from './interceptors/pomelo.signature.interceptor';
import { SignatureUtils } from './utils/pomelo.integration.process.signature';
import { HttpUtils } from './utils/pomelo.integration.process.http.utils';
import { PomeloCache } from '@integration/integration/util/pomelo.integration.process.cache';
import { Constants } from './utils/pomelo.integration.process.constants';

@Module({
  providers: [
    CommonService,
    ...databaseProviders,
    IntegrationModule,
    SignatureUtils,
    HttpUtils,
    SignatureInterceptor,
    PomeloCache,
    Constants,
  ],
  exports: [CommonService, ...databaseProviders, SignatureInterceptor],
})
export class CommonModule {}
