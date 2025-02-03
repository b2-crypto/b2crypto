import { Traceable } from '@amplication/opentelemetry-nestjs';
import { BasicServiceModel } from '@common/common/models/basic-service.model';
import { Inject, Injectable } from '@nestjs/common';
import { StatusCreateDto } from '@status/status/dto/status.create.dto';
import { StatusUpdateDto } from '@status/status/dto/status.update.dto';
import { StatusDocument } from '@status/status/entities/mongoose/status.schema';
import { Model } from 'mongoose';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Traceable()
@Injectable()
export class StatusServiceMongooseService extends BasicServiceModel<
  StatusDocument,
  Model<StatusDocument>,
  StatusCreateDto,
  StatusUpdateDto
> {
  constructor(
    @InjectPinoLogger(StatusServiceMongooseService.name)
    protected readonly logger: PinoLogger,
    @Inject('STATUS_MODEL_MONGOOSE') private statusModel: Model<StatusDocument>,
  ) {
    super(logger, statusModel);
  }
}
