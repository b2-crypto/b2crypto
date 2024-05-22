import { CommonModule } from '@common/common';
import { Module } from '@nestjs/common';
import { PermissionServiceMongooseService } from '@permission/permission/permission-service-mongoose.service';
import { ResponseB2CryptoModule } from '@response-b2crypto/response-b2crypto';
import { permissionProviders } from './providers/permission.providers';

@Module({
  imports: [CommonModule, ResponseB2CryptoModule],
  providers: [PermissionServiceMongooseService, ...permissionProviders],
  exports: [PermissionServiceMongooseService, ...permissionProviders],
})
export class PermissionModule {}
