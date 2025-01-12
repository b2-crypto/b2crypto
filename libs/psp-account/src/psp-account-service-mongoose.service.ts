import { BasicServiceModel } from '@common/common/models/basic-service.model';
import { Inject, Injectable } from '@nestjs/common';
import { PspAccountCreateDto } from '@psp-account/psp-account/dto/psp-account.create.dto';
import { PspAccountUpdateDto } from '@psp-account/psp-account/dto/psp-account.update.dto';
import { PspAccountDocument } from '@psp-account/psp-account/entities/mongoose/psp-account.schema';
import { Model } from 'mongoose';

import { Traceable } from '@amplication/opentelemetry-nestjs';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Traceable()
@Injectable()
export class PspAccountServiceMongooseService extends BasicServiceModel<
  PspAccountDocument,
  Model<PspAccountDocument>,
  PspAccountCreateDto,
  PspAccountUpdateDto
> {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) protected readonly logger: Logger,
    @Inject('PSP_ACCOUNT_MODEL_MONGOOSE')
    pspaccountModel: Model<PspAccountDocument>,
  ) {
    super(logger, pspaccountModel);
  }
}
