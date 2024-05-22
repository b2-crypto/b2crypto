import { CommonModule } from '@common/common';
import { IpAddressServiceMongooseService } from '@ip-address/ip-address/ip-address-service-mongoose.service';
import { Module } from '@nestjs/common';
import { ResponseB2CryptoModule } from '@response-b2crypto/response-b2crypto';
import { ipAddressProviders } from './providers/ip-address.providers';

@Module({
  imports: [CommonModule, ResponseB2CryptoModule],
  providers: [IpAddressServiceMongooseService, ...ipAddressProviders],
  exports: [IpAddressServiceMongooseService, ...ipAddressProviders],
})
export class IpAddressModule {}
