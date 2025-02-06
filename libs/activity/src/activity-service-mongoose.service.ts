import { ActivityCreateDto } from '@activity/activity/dto/activity.create.dto';
import { ActivityUpdateDto } from '@activity/activity/dto/activity.update.dto';
import { ActivityDocument } from '@activity/activity/entities/mongoose/activity.schema';
import { Traceable } from '@amplication/opentelemetry-nestjs';
import { BasicServiceModel } from '@common/common/models/basic-service.model';
import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Traceable()
@Injectable()
export class ActivityServiceMongooseService extends BasicServiceModel<
  ActivityDocument,
  Model<ActivityDocument>,
  ActivityCreateDto,
  ActivityUpdateDto
> {
  constructor(
    @InjectPinoLogger(ActivityServiceMongooseService.name)
    protected readonly logger: PinoLogger,
    @Inject('ACTIVITY_MODEL_MONGOOSE')
    activityModel: Model<ActivityDocument>,
  ) {
    super(logger, activityModel);
  }
}
