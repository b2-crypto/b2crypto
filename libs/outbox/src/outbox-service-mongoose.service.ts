import { Traceable } from '@amplication/opentelemetry-nestjs';
import { BasicServiceModel } from '@common/common/models/basic-service.model';
import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { OutboxCreateDto } from './dto/outbox.create.dto';
import { OutboxUpdateDto } from './dto/outbox.update.dto';
import { OutboxDocument } from './schemas/outbox.schema';

@Traceable()
@Injectable()
export class OutboxServiceMongooseService extends BasicServiceModel<
  OutboxDocument,
  Model<OutboxDocument>,
  OutboxCreateDto,
  OutboxUpdateDto
> {
  constructor(
    @InjectPinoLogger(OutboxServiceMongooseService.name)
    protected readonly logger: PinoLogger,
    @Inject('OUTBOX_MODEL_MONGOOSE')
    private readonly outboxModel: Model<OutboxDocument>,
  ) {
    super(logger, outboxModel);
  }
}
