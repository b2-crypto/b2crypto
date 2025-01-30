import { BasicServiceModel } from '@common/common/models/basic-service.model';
import { Inject, Injectable } from '@nestjs/common';
import { PspCreateDto } from '@psp/psp/dto/psp.create.dto';
import { PspUpdateDto } from '@psp/psp/dto/psp.update.dto';
import { PspDocument } from '@psp/psp/entities/mongoose/psp.schema';
import { Model } from 'mongoose';

import { Traceable } from '@amplication/opentelemetry-nestjs';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Traceable()
@Injectable()
export class PspServiceMongooseService extends BasicServiceModel<
  PspDocument,
  Model<PspDocument>,
  PspCreateDto,
  PspUpdateDto
> {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) protected readonly logger: Logger,
    @Inject('PSP_MODEL_MONGOOSE') pspModel: Model<PspDocument>,
  ) {
    super(logger, pspModel);
  }
}
