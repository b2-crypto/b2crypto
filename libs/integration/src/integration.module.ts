import { DistributedCacheModule } from '@app/distributed-cache';
import { BuildersModule } from '@builder/builders';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { IntegrationService } from './integration.service';

@Module({
  imports: [
    DistributedCacheModule,
    BuildersModule,
    HttpModule.registerAsync({
      useFactory: () => ({
        timeout: 5000,
        maxRedirects: 5,
      }),
    }),
  ],
  providers: [IntegrationService],
  exports: [IntegrationService],
})
export class IntegrationModule {}
