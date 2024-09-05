import { BuildersModule } from '@builder/builders';
import { IntegrationService } from './integration.service';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    CacheModule.register({}),
    HttpModule,
    BuildersModule,
    HttpModule.registerAsync({
      useFactory: () => ({
        timeout: 5000,
        maxRedirects: 5,
      }),
    }),
  ],
  providers: [IntegrationService, ConfigService],
  exports: [IntegrationService],
})
export class IntegrationModule {}
