import { BasicServiceModel } from '@common/common/models/basic-service.model';
import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { PersonCreateDto } from './dto/person.create.dto';
import { PersonUpdateDto } from './dto/person.update.dto';
import { PersonDocument } from './entities/mongoose/person.schema';

import { Traceable } from '@amplication/opentelemetry-nestjs';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Traceable()
@Injectable()
export class PersonServiceMongooseService extends BasicServiceModel<
  PersonDocument,
  Model<PersonDocument>,
  PersonCreateDto,
  PersonUpdateDto
> {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) protected readonly logger: Logger,
    @Inject('PERSON_MODEL_MONGOOSE') personModel: Model<PersonDocument>,
  ) {
    super(logger, personModel);
  }
}
