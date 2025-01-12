import { BasicServiceModel } from '@common/common/models/basic-service.model';
import { Inject, Injectable } from '@nestjs/common';
import { StatusCreateDto } from '@status/status/dto/status.create.dto';
import { StatusUpdateDto } from '@status/status/dto/status.update.dto';
import { StatusDocument } from '@status/status/entities/mongoose/status.schema';
import { Model } from 'mongoose';

import { Traceable } from '@amplication/opentelemetry-nestjs';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Traceable()
@Injectable()
export class StatusServiceMongooseService extends BasicServiceModel<
  StatusDocument,
  Model<StatusDocument>,
  StatusCreateDto,
  StatusUpdateDto
> {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) protected readonly logger: Logger,
    @Inject('STATUS_MODEL_MONGOOSE') private statusModel: Model<StatusDocument>,
  ) {
    super(logger, statusModel);
  }
}
