import { EnvironmentEnum } from '@common/common/enums/environment.enum';
import { QueueAdminService } from '@common/common/queue-admin-providers/queue.admin.provider.service';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { QueueAdminModule } from '../queue-admin-providers/queue.admin.provider.module';
import { ConfigService } from '@nestjs/config';

export async function bootstrapMicroservice(module, env: EnvironmentEnum) {
  const app = await NestFactory.create(module, {
    logger: false,
    cors: true,
  });

  const validationPipes = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  });
  app.useGlobalPipes(validationPipes);
  const configService = app.get<ConfigService>(ConfigService);
  app.connectMicroservice(
    await QueueAdminModule.getClientProvider(configService, env),
  );
  await app.startAllMicroservices();
  if (typeof process.send === 'function') {
    process.send('ready');
  }
}
