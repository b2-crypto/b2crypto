import { BasicServiceModel } from '@common/common/models/basic-service.model';
import { CrmCreateDto } from '@crm/crm/dto/crm.create.dto';
import { CrmUpdateDto } from '@crm/crm/dto/crm.update.dto';
import { CrmDocument } from '@crm/crm/entities/mongoose/crm.schema';
import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';

import { Traceable } from '@amplication/opentelemetry-nestjs';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Traceable()
@Injectable()
export class CrmServiceMongooseService extends BasicServiceModel<
  CrmDocument,
  Model<CrmDocument>,
  CrmCreateDto,
  CrmUpdateDto
> {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) protected readonly logger: Logger,
    @Inject('CRM_MODEL_MONGOOSE') crmModel: Model<CrmDocument>,
  ) {
    super(logger, crmModel);
  }
}
