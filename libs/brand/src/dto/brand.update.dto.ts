import { PartialType } from '@nestjs/mapped-types';
import { BrandCreateDto } from './brand.create.dto';
import { IsMongoId } from 'class-validator';
import { ObjectId } from 'mongodb';

export class BrandUpdateDto extends PartialType(BrandCreateDto) {
  @IsMongoId()
  id: ObjectId;
}
