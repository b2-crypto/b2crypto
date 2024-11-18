import { Module } from '@nestjs/common';
import { SecurityServiceController } from './security-service.controller';
import { SecurityServiceService } from './security-service.service';
import { BuildersModule } from '@builder/builders'; // Asegúrate de que esta ruta de importación sea correcta
import { IntegrationModule } from '@integration/integration'; // Asegúrate de que esta ruta de importación sea correcta
import { AuthModule } from '@auth/auth'; // Asegúrate de que esta ruta de importación sea correcta
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
@Module({
  imports: [
    BuildersModule,
    IntegrationModule,
    AuthModule,
    ConfigModule,
    CacheModule.register(),
  ],
  controllers: [SecurityServiceController],
  providers: [SecurityServiceService],
})
export class SecurityServiceModule {}
