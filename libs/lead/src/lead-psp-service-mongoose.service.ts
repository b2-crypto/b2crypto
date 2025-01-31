import { Traceable } from '@amplication/opentelemetry-nestjs';
import { BasicServiceModel } from '@common/common/models/basic-service.model';
import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { LeadPspCreateDto } from './dto/lead-psp.create.dto';
import { LeadPspUpdateDto } from './dto/lead-psp.update.dto';
import { LeadPspDocument } from './entities/mongoose/lead-psp.schema';

@Traceable()
@Injectable()
export class LeadPspServiceMongooseService extends BasicServiceModel<
  LeadPspDocument,
  Model<LeadPspDocument>,
  LeadPspCreateDto,
  LeadPspUpdateDto
> {
  constructor(
    @Inject('LEAD_PSP_MODEL_MONGOOSE') leadPspModel: Model<LeadPspDocument>,
  ) {
    super(leadPspModel);
  }
}
