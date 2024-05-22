import { CommonModule } from '@common/common';
import { Module } from '@nestjs/common';
import { ResponseB2CryptoModule } from '@response-b2crypto/response-b2crypto';
import { TrafficServiceMongooseService } from '@traffic/traffic/traffic-service-mongoose.service';
import { trafficProviders } from './providers/traffic.providers';

@Module({
  imports: [CommonModule, ResponseB2CryptoModule],
  providers: [TrafficServiceMongooseService, ...trafficProviders],
  exports: [TrafficServiceMongooseService, ...trafficProviders],
})
export class TrafficModule {}
