import { CommonModule } from '@common/common';
import { Module } from '@nestjs/common';
import { ResponseB2CryptoModule } from '@response-b2crypto/response-b2crypto';
import { TransferServiceMongooseService } from '@transfer/transfer/transfer-service-mongoose.service';
import { transferProviders } from './providers/transfer.providers';

@Module({
  imports: [CommonModule, ResponseB2CryptoModule],
  providers: [TransferServiceMongooseService, ...transferProviders],
  exports: [TransferServiceMongooseService, ...transferProviders],
})
export class TransferModule {}
