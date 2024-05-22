import { ActivityServiceMongooseService } from '@activity/activity/activity-service-mongoose.service';
import { CommonModule } from '@common/common';
import { Module } from '@nestjs/common';
import { ResponseB2CryptoModule } from '@response-b2crypto/response-b2crypto';
import { activityProviders } from './providers/activity.providers';

@Module({
  imports: [CommonModule, ResponseB2CryptoModule],
  providers: [ActivityServiceMongooseService, ...activityProviders],
  exports: [ActivityServiceMongooseService, ...activityProviders],
})
export class ActivityModule {}
