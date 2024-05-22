import { CommonModule } from '@common/common';
import { Module } from '@nestjs/common';
import { PersonServiceMongooseService } from '@person/person/person-service-mongoose.service';
import { ResponseB2CryptoModule } from '@response-b2crypto/response-b2crypto';
import { personProviders } from './providers/person.providers';

@Module({
  imports: [CommonModule, ResponseB2CryptoModule],
  providers: [PersonServiceMongooseService, ...personProviders],
  exports: [PersonServiceMongooseService, ...personProviders],
})
export class PersonModule {}
