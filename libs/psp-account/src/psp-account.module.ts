import { CommonModule } from '@common/common';
import { Module } from '@nestjs/common';
import { PspAccountServiceMongooseService } from '@psp-account/psp-account/psp-account-service-mongoose.service';
import { ResponseB2CryptoModule } from '@response-b2crypto/response-b2crypto';
import { PspAccountProviders } from './providers/psp-account.providers';

@Module({
  imports: [CommonModule, ResponseB2CryptoModule],
  providers: [PspAccountServiceMongooseService, ...PspAccountProviders],
  exports: [PspAccountServiceMongooseService, ...PspAccountProviders],
})
export class PspAccountModule {}
