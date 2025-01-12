import { BrandCreateDto } from '@brand/brand/dto/brand.create.dto';
import { BrandUpdateDto } from '@brand/brand/dto/brand.update.dto';
import { BrandDocument } from '@brand/brand/entities/mongoose/brand.schema';
import { BasicServiceModel } from '@common/common/models/basic-service.model';
import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';

import { Traceable } from '@amplication/opentelemetry-nestjs';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Traceable()
@Injectable()
export class BrandServiceMongooseService extends BasicServiceModel<
  BrandDocument,
  Model<BrandDocument>,
  BrandCreateDto,
  BrandUpdateDto
> {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) protected readonly logger: Logger,
    @Inject('BRAND_MODEL_MONGOOSE')
    brandModel: Model<BrandDocument>,
  ) {
    super(logger, brandModel);
  }
}
