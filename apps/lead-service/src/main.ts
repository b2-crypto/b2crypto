import { LeadServiceModule } from './lead-service.module';
import { NestFactory } from '@nestjs/core';

async function bootstrap() {
  const app = await NestFactory.create(LeadServiceModule, {
    logger: false,
  });
  app.enableCors();
  await app.listen(process.env.PORT ?? 3000);
  if (typeof process.send === 'function') {
    process.send('ready');
  }
}

bootstrap();
