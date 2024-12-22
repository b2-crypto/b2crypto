import { DistributedCacheModule } from '@app/distributed-cache';
import { IntegrationModule } from '@integration/integration';
import { PomeloCache } from '@integration/integration/util/pomelo.integration.process.cache';
import { Module } from '@nestjs/common';
import { CommonService } from './common.service';
import { databaseProviders } from './database-providers/database-providers.service';
import { PomeloSignatureInterceptor } from './interceptors/pomelo.signature.interceptor';
import { PomeloProcessConstants } from './utils/pomelo.integration.process.constants';
import { PomeloHttpUtils } from './utils/pomelo.integration.process.http.utils';
import { PomeloSignatureUtils } from './utils/pomelo.integration.process.signature';

@Module({
  imports: [DistributedCacheModule],
  providers: [
    PomeloCache,
    CommonService,
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
