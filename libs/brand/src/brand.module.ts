import { BrandServiceMongooseService } from '@brand/brand/brand-service-mongoose.service';
import { CommonModule } from '@common/common';
import { Module } from '@nestjs/common';
import { ResponseB2CryptoModule } from '@response-b2crypto/response-b2crypto';
import { brandProviders } from './providers/brand.providers';

@Module({
  imports: [CommonModule, ResponseB2CryptoModule],
  providers: [BrandServiceMongooseService, ...brandProviders],
  exports: [BrandServiceMongooseService, ...brandProviders],
})
export class BrandModule {}
