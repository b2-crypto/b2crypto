import { NestFactory } from '@nestjs/core';
import { IntegrationServiceModule } from './integration-service.module';

async function bootstrap() {
  const app = await NestFactory.create(IntegrationServiceModule);
  await app.listen(3000);
}
bootstrap();
