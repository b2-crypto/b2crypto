import { Traceable } from '@amplication/opentelemetry-nestjs';
import { CategoryDocument } from '@category/category/entities/mongoose/category.schema';
import { BasicServiceModel } from '@common/common/models/basic-service.model';
import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { CategoryCreateDto } from './dto/category.create.dto';
import { CategoryUpdateDto } from './dto/category.update.dto';

@Traceable()
@Injectable()
export class CategoryServiceMongooseService extends BasicServiceModel<
  CategoryDocument,
  Model<CategoryDocument>,
  CategoryCreateDto,
  CategoryUpdateDto
> {
  constructor(
    @Inject('CATEGORY_MODEL_MONGOOSE')
    categoryModel: Model<CategoryDocument>,
  ) {
    super(categoryModel);
  }
}
