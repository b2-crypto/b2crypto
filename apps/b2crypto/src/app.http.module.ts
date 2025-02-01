import { JwtAuthGuard } from '@auth/auth/guards/jwt-auth.guard';
import { PoliciesGuard } from '@auth/auth/guards/policy.ability.guard';
import { Module, OnModuleInit } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JobModule } from 'apps/job-service/job.module';
import { SeedModule } from 'apps/seed-service/seed.module';
import { SeedService } from 'apps/seed-service/seed.service';
import { LoggerModule } from 'nestjs-pino';
import { configApp } from './config.app.const';
import { loggerConfig } from './logger.config';

const configHttp = {
  ...configApp,
};

configHttp.imports.push(JobModule, LoggerModule.forRoot(loggerConfig));

configHttp.providers.push({
  provide: APP_GUARD,
  useClass: JwtAuthGuard,
});

configHttp.providers.push({
  provide: APP_GUARD,
  useClass: PoliciesGuard,
});

configHttp.imports.push(SeedModule);

@Module(configHttp)
export class AppHttpModule implements OnModuleInit {
  constructor(private seedService: SeedService) {}

  async onModuleInit(): Promise<void> {
    await this.seedService.saveInitialData();
  }
}
