import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { databaseProviders } from './database-providers/database-providers.service';
import { IntegrationModule } from '@integration/integration';
import { SignatureInterceptor } from './interceptors/pomelo.signature.interceptor';
import { PomeloSignatureUtils } from './utils/pomelo.integration.process.signature';
import { PomeloHttpUtils } from './utils/pomelo.integration.process.http.utils';
import { PomeloCache } from '@integration/integration/util/pomelo.integration.process.cache';
import { PomeloProcessConstants } from './utils/pomelo.integration.process.constants';

@Module({
  providers: [
    CommonService,
    PomeloHttpUtils,
    ...databaseProviders,
    IntegrationModule,
    PomeloSignatureUtils,
    SignatureInterceptor,
    PomeloCache,
    PomeloProcessConstants,
  ],
  exports: [
    CommonService,
    PomeloHttpUtils,
    ...databaseProviders,
    SignatureInterceptor,
  ],
})
export class CommonModule {}
