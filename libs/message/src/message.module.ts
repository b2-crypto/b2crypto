import { CommonModule } from '@common/common';
import { MessageServiceMongooseService } from '@message/message/message-service-mongoose.service';
import { Module } from '@nestjs/common';
import { ResponseB2CryptoModule } from '@response-b2crypto/response-b2crypto';
import { MessageProviders } from './providers/messageProviders';

@Module({
  imports: [CommonModule, ResponseB2CryptoModule],
  providers: [MessageServiceMongooseService, ...MessageProviders],
  exports: [MessageServiceMongooseService, ...MessageProviders],
})
export class MessageModule {}
