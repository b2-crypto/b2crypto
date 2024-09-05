import { CommonModule } from '@common/common';
import { Module } from '@nestjs/common';
import { ResponseB2CryptoModule } from '@response-b2crypto/response-b2crypto';
import { RoleModule } from '@role/role';
import { UserServiceMongooseService } from '@user/user/user-service-mongoose.service';
import { userProviders } from './providers/user.providers';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [CommonModule, ResponseB2CryptoModule, RoleModule],
  providers: [UserServiceMongooseService, ...userProviders, ConfigService],
  exports: [UserServiceMongooseService, ...userProviders],
})
export class UserModule {}
