import { Traceable } from '@amplication/opentelemetry-nestjs';
import { BasicServiceModel } from '@common/common/models/basic-service.model';
import { GroupCreateDto } from '@group/group/dto/group.create.dto';
import { GroupUpdateDto } from '@group/group/dto/group.update.dto';
import { GroupDocument } from '@group/group/entities/mongoose/group.schema';
import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Traceable()
@Injectable()
export class GroupServiceMongooseService extends BasicServiceModel<
  GroupDocument,
  Model<GroupDocument>,
  GroupCreateDto,
  GroupUpdateDto
> {
  constructor(
    @InjectPinoLogger(GroupServiceMongooseService.name)
    protected readonly logger: PinoLogger,
    @Inject('GROUP_MODEL_MONGOOSE') groupModel: Model<GroupDocument>,
  ) {
    super(logger, groupModel);
  }
}
