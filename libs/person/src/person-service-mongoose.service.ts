import { Traceable } from '@amplication/opentelemetry-nestjs';
import { BasicServiceModel } from '@common/common/models/basic-service.model';
import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { PersonCreateDto } from './dto/person.create.dto';
import { PersonUpdateDto } from './dto/person.update.dto';
import { PersonDocument } from './entities/mongoose/person.schema';

@Traceable()
@Injectable()
export class PersonServiceMongooseService extends BasicServiceModel<
  PersonDocument,
  Model<PersonDocument>,
  PersonCreateDto,
  PersonUpdateDto
> {
  constructor(
    @InjectPinoLogger(PersonServiceMongooseService.name)
    protected readonly logger: PinoLogger,
    @Inject('PERSON_MODEL_MONGOOSE') personModel: Model<PersonDocument>,
  ) {
    super(logger, personModel);
  }
}
