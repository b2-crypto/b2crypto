import { Traceable } from '@amplication/opentelemetry-nestjs';
import { BasicServiceModel } from '@common/common/models/basic-service.model';
import { MessageCreateDto } from '@message/message/dto/message.create.dto';
import { MessageUpdateDto } from '@message/message/dto/message.update.dto';
import { MessageDocument } from '@message/message/entities/mongoose/message.schema';
import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Traceable()
@Injectable()
export class MessageServiceMongooseService extends BasicServiceModel<
  MessageDocument,
  Model<MessageDocument>,
  MessageCreateDto,
  MessageUpdateDto
> {
  constructor(
    @InjectPinoLogger(MessageServiceMongooseService.name)
    protected readonly logger: PinoLogger,
    @Inject('MESSAGE_MODEL_MONGOOSE')
    messageModel: Model<MessageDocument>,
  ) {
    super(logger, messageModel);
  }
}
