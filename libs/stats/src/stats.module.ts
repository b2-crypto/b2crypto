import { CommonModule } from '@common/common';
import { Module } from '@nestjs/common';
import { ResponseB2CryptoModule } from '@response-b2crypto/response-b2crypto';
import { statsProviders } from './providers/stats.providers';
import { StatsDateAffiliateServiceMongooseService } from './stats.date.affiliate.service.mongoose.service';
import { StatsDatePspAccountServiceMongooseService } from './stats.date.psp.account.service.mongoose.service';
import { StatsDateServiceMongooseService } from './stats.date.service.mongoose.service';

@Module({
  imports: [CommonModule, ResponseB2CryptoModule],
  providers: [
    ...statsProviders,
    StatsDateServiceMongooseService,
    StatsDateAffiliateServiceMongooseService,
    StatsDatePspAccountServiceMongooseService,
  ],
  exports: [
    ...statsProviders,
    StatsDateServiceMongooseService,
    StatsDateAffiliateServiceMongooseService,
    StatsDatePspAccountServiceMongooseService,
  ],
})
export class StatsModule {}
