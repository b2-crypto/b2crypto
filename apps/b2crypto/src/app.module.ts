import { OpenTelemetryModule } from '@amplication/opentelemetry-nestjs';
import { Module } from '@nestjs/common';
import { JobModule } from 'apps/job-service/job.module';
import { configApp } from './config.app.const';

@Module({
  imports: [
    OpenTelemetryModule.forRoot(),
    ...new Set([...configApp.imports, ...[JobModule]]),
  ],
  controllers: [...new Set([...configApp.controllers])],
  providers: [...new Set([...configApp.providers])],
  exports: [...new Set([...configApp.exports])],
})
export class AppModule {}
