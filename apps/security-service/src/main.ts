import { NestFactory } from '@nestjs/core';
import { SecurityServiceModule } from './security-service.module';

async function bootstrap() {
  const app = await NestFactory.create(SecurityServiceModule, {
    // logger: false,
  });
  app.enableCors();
  await app.listen(process.env.PORT ?? 3000);
  if (typeof process.send === 'function') {
    process.send('ready');
  }
}

bootstrap();
