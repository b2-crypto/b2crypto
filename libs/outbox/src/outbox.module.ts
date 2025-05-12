import { CommonModule } from '@common/common';
import { Module } from '@nestjs/common';
import { ResponseB2CryptoModule } from '@response-b2crypto/response-b2crypto';
import { OutboxServiceMongooseService } from './outbox-service-mongoose.service';
import { outboxProviders } from './providers/outbox.providers';

@Module({
  imports: [CommonModule, ResponseB2CryptoModule],
  providers: [OutboxServiceMongooseService, ...outboxProviders],
  exports: [OutboxServiceMongooseService, ...outboxProviders],
})
export class OutboxModule {}
