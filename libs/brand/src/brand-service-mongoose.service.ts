import { Traceable } from '@amplication/opentelemetry-nestjs';
import { BrandCreateDto } from '@brand/brand/dto/brand.create.dto';
import { BrandUpdateDto } from '@brand/brand/dto/brand.update.dto';
import { BrandDocument } from '@brand/brand/entities/mongoose/brand.schema';
import { BasicServiceModel } from '@common/common/models/basic-service.model';
import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Traceable()
@Injectable()
export class BrandServiceMongooseService extends BasicServiceModel<
  BrandDocument,
  Model<BrandDocument>,
  BrandCreateDto,
  BrandUpdateDto
> {
  constructor(
    @InjectPinoLogger(BrandServiceMongooseService.name)
    protected readonly logger: PinoLogger,
    @Inject('BRAND_MODEL_MONGOOSE')
    brandModel: Model<BrandDocument>,
  ) {
    super(logger, brandModel);
  }
}
