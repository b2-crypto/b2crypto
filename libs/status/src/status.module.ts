import { CommonModule } from '@common/common';
import { Module } from '@nestjs/common';
import { ResponseB2CryptoModule } from '@response-b2crypto/response-b2crypto';
import { StatusServiceMongooseService } from '@status/status/status-service-mongoose.service';
import { statusProviders } from './providers/status.providers';

@Module({
  imports: [CommonModule, ResponseB2CryptoModule],
  providers: [StatusServiceMongooseService, ...statusProviders],
  exports: [StatusServiceMongooseService, ...statusProviders],
})
export class StatusModule {}
