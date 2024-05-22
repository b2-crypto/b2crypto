import { PspServiceMongooseService } from '@psp/psp/psp-service-mongoose.service';
import { pspProviders } from './providers/psp.providers';
import { CommonModule } from '@common/common';
import { Module } from '@nestjs/common';
import { ResponseB2CryptoModule } from '@response-b2crypto/response-b2crypto';

@Module({
  imports: [CommonModule, ResponseB2CryptoModule],
  providers: [PspServiceMongooseService, ...pspProviders],
  exports: [PspServiceMongooseService, ...pspProviders],
})
export class PspModule {}
