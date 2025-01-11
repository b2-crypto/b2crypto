import { OpenTelemetryModule } from '@amplication/opentelemetry-nestjs';
import { Module } from '@nestjs/common';
import { JobModule } from 'apps/job-service/job.module';
import { WinstonModule } from 'nest-winston';
import { configApp } from './config.app.const';
import { logger } from './opentelemetry';

@Module({
  imports: [
    OpenTelemetryModule.forRoot(),
    WinstonModule.forRoot({
      instance: logger,
    }),
    ...new Set([...configApp.imports, ...[JobModule]]),
  ],
  controllers: [...new Set([...configApp.controllers])],
  providers: [...new Set([...configApp.providers])],
  exports: [...new Set([...configApp.exports])],
})
export class AppModule {}
