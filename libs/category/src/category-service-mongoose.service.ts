import { CategoryDocument } from '@category/category/entities/mongoose/category.schema';
import { BasicServiceModel } from '@common/common/models/basic-service.model';
import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { CategoryCreateDto } from './dto/category.create.dto';
import { CategoryUpdateDto } from './dto/category.update.dto';

import { Traceable } from '@amplication/opentelemetry-nestjs';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Traceable()
@Injectable()
export class CategoryServiceMongooseService extends BasicServiceModel<
  CategoryDocument,
  Model<CategoryDocument>,
  CategoryCreateDto,
  CategoryUpdateDto
> {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) protected readonly logger: Logger,
    @Inject('CATEGORY_MODEL_MONGOOSE')
    categoryModel: Model<CategoryDocument>,
  ) {
    super(logger, categoryModel);
  }
}
