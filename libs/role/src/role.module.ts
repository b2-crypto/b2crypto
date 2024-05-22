import { CommonModule } from '@common/common';
import { Module } from '@nestjs/common';
import { PermissionModule } from '@permission/permission';
import { ResponseB2CryptoModule } from '@response-b2crypto/response-b2crypto';
import { RoleServiceMongooseService } from '@role/role/role-service-mongoose.service';
import { roleProviders } from './providers/role.providers';

@Module({
  imports: [CommonModule, ResponseB2CryptoModule, PermissionModule],
  providers: [RoleServiceMongooseService, ...roleProviders],
  exports: [RoleServiceMongooseService, ...roleProviders],
})
export class RoleModule {}
