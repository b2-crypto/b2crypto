import { BasicServiceModel } from '@common/common/models/basic-service.model';
import { GroupCreateDto } from '@group/group/dto/group.create.dto';
import { GroupUpdateDto } from '@group/group/dto/group.update.dto';
import { GroupDocument } from '@group/group/entities/mongoose/group.schema';
import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';

import { Traceable } from '@amplication/opentelemetry-nestjs';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Traceable()
@Injectable()
export class GroupServiceMongooseService extends BasicServiceModel<
  GroupDocument,
  Model<GroupDocument>,
  GroupCreateDto,
  GroupUpdateDto
> {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) protected readonly logger: Logger,
    @Inject('GROUP_MODEL_MONGOOSE') groupModel: Model<GroupDocument>,
  ) {
    super(logger, groupModel);
  }
}
