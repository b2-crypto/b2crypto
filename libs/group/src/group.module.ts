import { CommonModule } from '@common/common';
import { GroupServiceMongooseService } from '@group/group/group-service-mongoose.service';
import { Module } from '@nestjs/common';
import { ResponseB2CryptoModule } from '@response-b2crypto/response-b2crypto';
import { groupProviders } from './providers/group.providers';

@Module({
  imports: [CommonModule, ResponseB2CryptoModule],
  providers: [GroupServiceMongooseService, ...groupProviders],
  exports: [GroupServiceMongooseService, ...groupProviders],
})
export class GroupModule {}
