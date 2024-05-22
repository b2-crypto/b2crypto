import { AccountServiceMongooseService } from '@account/account/account-service-mongoose.service';
import { CommonModule } from '@common/common';
import { Module } from '@nestjs/common';
import { ResponseB2CryptoModule } from '@response-b2crypto/response-b2crypto';
import { accountProviders } from './providers/account.providers';

@Module({
  imports: [CommonModule, ResponseB2CryptoModule],
  providers: [AccountServiceMongooseService, ...accountProviders],
  exports: [AccountServiceMongooseService, ...accountProviders],
})
export class AccountModule {}
