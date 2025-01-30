import { ActivityCreateDto } from '@activity/activity/dto/activity.create.dto';
import { ActivityUpdateDto } from '@activity/activity/dto/activity.update.dto';
import { ActivityDocument } from '@activity/activity/entities/mongoose/activity.schema';
import { BasicServiceModel } from '@common/common/models/basic-service.model';
import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';

import { Traceable } from '@amplication/opentelemetry-nestjs';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Traceable()
@Injectable()
export class ActivityServiceMongooseService extends BasicServiceModel<
  ActivityDocument,
  Model<ActivityDocument>,
  ActivityCreateDto,
  ActivityUpdateDto
> {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) protected readonly logger: Logger,
    @Inject('ACTIVITY_MODEL_MONGOOSE')
    activityModel: Model<ActivityDocument>,
  ) {
    super(logger, activityModel);
  }
}
