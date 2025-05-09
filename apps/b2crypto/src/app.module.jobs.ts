import { OpenTelemetryModule } from '@amplication/opentelemetry-nestjs';
import { CorrelationIdMiddleware } from '@common/common/middlewares';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { JobModule } from 'apps/job-service/job.module';
import { LoggerModule } from 'nestjs-pino';
import { configApp } from './config.app.const';
import { loggerConfig } from './logger.config';
import { ResponseB2CryptoModule } from '@response-b2crypto/response-b2crypto';
import { DistributedCacheModule } from '@app/distributed-cache';
import configuration from '@config/config';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    DistributedCacheModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    OpenTelemetryModule.forRoot(),
    LoggerModule.forRoot(loggerConfig),
    ResponseB2CryptoModule,
    JobModule,
  ],
  providers: [...new Set([...configApp.providers])],
  exports: [...new Set([...configApp.exports])],
})
export class AppModuleJobs implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
