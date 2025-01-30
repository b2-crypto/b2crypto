import { BasicServiceModel } from '@common/common/models/basic-service.model';
import { MessageCreateDto } from '@message/message/dto/message.create.dto';
import { MessageUpdateDto } from '@message/message/dto/message.update.dto';
import { MessageDocument } from '@message/message/entities/mongoose/message.schema';
import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';

import { Traceable } from '@amplication/opentelemetry-nestjs';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Traceable()
@Injectable()
export class MessageServiceMongooseService extends BasicServiceModel<
  MessageDocument,
  Model<MessageDocument>,
  MessageCreateDto,
  MessageUpdateDto
> {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) protected readonly logger: Logger,
    @Inject('MESSAGE_MODEL_MONGOOSE')
    messageModel: Model<MessageDocument>,
  ) {
    super(logger, messageModel);
  }
}
