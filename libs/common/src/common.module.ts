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
import { PomeloProcessConstants } from './utils/pomelo.integration.process.constants';

@Module({
  providers: [
    HttpUtils,
    CommonService,
    ...databaseProviders,
    IntegrationModule,
    SignatureUtils,
    SignatureInterceptor,
    PomeloCache,
    PomeloProcessConstants,
  ],
  exports: [
    HttpUtils,
    CommonService,
    ...databaseProviders,
    SignatureInterceptor,
  ],
})
export class CommonModule {}
