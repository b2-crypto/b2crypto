import { EnvironmentEnum } from '@common/common/enums/environment.enum';
import { QueueAdminModule } from '@common/common/queue-admin-providers/queue.admin.provider.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModuleJobs } from './app.module.jobs';

async function bootstrap(port?: number | string) {
  Logger.log(process.env.TZ, 'Timezone Microservice');
  port = port ?? process.env.PORT ?? 3000;
  const app = await NestFactory.create(AppModuleJobs, {
    // logger: false,
    cors: true,
  });
  const configService = app.get(ConfigService);

  const validationPipes = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  });
  app.useGlobalPipes(validationPipes);
  app.connectMicroservice(
    await QueueAdminModule.getClientProvider(
      configService,
      configService.get('ENVIRONMENT') ?? EnvironmentEnum.dev,
    ),
  );
  Logger.log(port, 'Port Microservice Jobs');
  await app.listen(port);
}

bootstrap(3001);
