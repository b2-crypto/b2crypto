import { QueueAdminService } from '@common/common/queue-admin-providers/queue.admin.provider.service';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppHttpModule } from './app.http.module';
import { EnvironmentEnum } from '@common/common/enums/environment.enum';
import { ConfigService } from '@nestjs/config';
import { QueueAdminModule } from '@common/common/queue-admin-providers/queue.admin.provider.module';

async function bootstrap() {
  Logger.log(process.env.TZ, 'Timezone Microservice');
  const app = await NestFactory.create(AppHttpModule, {
    logger: false,
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
  await app.startAllMicroservices();
  if (typeof process.send === 'function') {
    process.send('ready');
  }
}

bootstrap();
