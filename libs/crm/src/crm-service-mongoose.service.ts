import { Traceable } from '@amplication/opentelemetry-nestjs';
import { BasicServiceModel } from '@common/common/models/basic-service.model';
import { CrmCreateDto } from '@crm/crm/dto/crm.create.dto';
import { CrmUpdateDto } from '@crm/crm/dto/crm.update.dto';
import { CrmDocument } from '@crm/crm/entities/mongoose/crm.schema';
import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Traceable()
@Injectable()
export class CrmServiceMongooseService extends BasicServiceModel<
  CrmDocument,
  Model<CrmDocument>,
  CrmCreateDto,
  CrmUpdateDto
> {
  constructor(
    @InjectPinoLogger(CrmServiceMongooseService.name)
    protected readonly logger: PinoLogger,
    @Inject('CRM_MODEL_MONGOOSE') crmModel: Model<CrmDocument>,
  ) {
    super(logger, crmModel);
  }
}
