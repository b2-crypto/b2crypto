import { BuildersModule } from '@builder/builders';
import { Module } from '@nestjs/common';
import { PersonModule } from '@person/person';
import { UserModule } from '@user/user';
import { UserServiceService } from 'apps/user-service/src/user-service.service';
import { PersonServiceController } from './person-service.controller';
import { PersonServiceService } from './person-service.service';

@Module({
  imports: [PersonModule, BuildersModule, UserModule],
  controllers: [PersonServiceController],
  providers: [PersonServiceService, UserServiceService],
})
export class PersonServiceModule {}
