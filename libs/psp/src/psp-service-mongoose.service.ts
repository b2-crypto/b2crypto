import { Traceable } from '@amplication/opentelemetry-nestjs';
import { BasicServiceModel } from '@common/common/models/basic-service.model';
import { Inject, Injectable } from '@nestjs/common';
import { PspCreateDto } from '@psp/psp/dto/psp.create.dto';
import { PspUpdateDto } from '@psp/psp/dto/psp.update.dto';
import { PspDocument } from '@psp/psp/entities/mongoose/psp.schema';
import { Model } from 'mongoose';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Traceable()
@Injectable()
export class PspServiceMongooseService extends BasicServiceModel<
  PspDocument,
  Model<PspDocument>,
  PspCreateDto,
  PspUpdateDto
> {
  constructor(
    @InjectPinoLogger(PspServiceMongooseService.name)
    protected readonly logger: PinoLogger,
    @Inject('PSP_MODEL_MONGOOSE') pspModel: Model<PspDocument>,
  ) {
    super(logger, pspModel);
  }
}
