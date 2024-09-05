import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { databaseProviders } from './database-providers/database-providers.service';
import { IntegrationModule } from '@integration/integration';
import { PomeloSignatureInterceptor } from './interceptors/pomelo.signature.interceptor';
import { PomeloSignatureUtils } from './utils/pomelo.integration.process.signature';
import { PomeloHttpUtils } from './utils/pomelo.integration.process.http.utils';
import { PomeloCache } from '@integration/integration/util/pomelo.integration.process.cache';
import { PomeloProcessConstants } from './utils/pomelo.integration.process.constants';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [CacheModule.register({})],
  providers: [
    PomeloCache,
    CommonService,
    ConfigService,
    PomeloHttpUtils,
    IntegrationModule,
    PomeloSignatureUtils,
    ...databaseProviders,
    PomeloProcessConstants,
    PomeloSignatureInterceptor,
  ],
  exports: [
    CommonService,
    PomeloHttpUtils,
    ...databaseProviders,
    PomeloSignatureInterceptor,
  ],
})
export class CommonModule {}
