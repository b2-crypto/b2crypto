import { PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsDate,
  IsEmpty,
  IsMongoId,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { ObjectId } from 'mongodb';
import { AccountCreateDto } from './account.create.dto';

export class AccountUpdateDto extends PartialType(AccountCreateDto) {
  @IsMongoId()
  id: ObjectId;

  @IsOptional()
  @IsMongoId()
  affiliate?: ObjectId;

  @IsNumber()
  @IsEmpty()
  amount?: number;

  @IsNumber()
  @IsOptional()
  totalTransfer?: number;

  @IsNumber()
  @IsOptional()
  partialFtdAmount?: number;

  @IsDate()
  @IsOptional()
  partialFtdDate?: Date;

  @IsNumber()
  @IsOptional()
  quantityTransfer?: number;

  @IsArray()
  @IsOptional()
  @IsMongoId({ each: true })
  transfers?: ObjectId[];
}
