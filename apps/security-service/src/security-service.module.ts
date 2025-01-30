import { DistributedCacheModule } from '@app/distributed-cache';
import { AuthModule } from '@auth/auth'; // Asegúrate de que esta ruta de importación sea correcta
import { BuildersModule } from '@builder/builders'; // Asegúrate de que esta ruta de importación sea correcta
import { IntegrationModule } from '@integration/integration'; // Asegúrate de que esta ruta de importación sea correcta
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
// import { SecurityServiceController } from './security-service.controller';
import { SecurityServiceService } from './security-service.service';
@Module({
  imports: [
    BuildersModule,
    IntegrationModule,
    AuthModule,
    ConfigModule,
    DistributedCacheModule,
  ],
  // controllers: [SecurityServiceController],
  providers: [SecurityServiceService],
})
export class SecurityServiceModule {}
