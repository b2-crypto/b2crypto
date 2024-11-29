import { AuthModule } from '@auth/auth';
import { BuildersModule } from '@builder/builders';
import { IntegrationModule } from '@integration/integration';
import { Module } from '@nestjs/common';
import { UserModule } from '@user/user';
import { AuthServiceController } from '../../auth-service/src/auth-service.controller';
import { UserServiceController } from './user-service.controller';
import { UserServiceService } from './user-service.service';

@Module({
  imports: [UserModule, BuildersModule, AuthModule, IntegrationModule],
  controllers: [UserServiceController, AuthServiceController],
  providers: [UserServiceService],
})
export class UserServiceModule { }
