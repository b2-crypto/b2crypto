import { PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsDate,
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
  @IsOptional()
  amount?: number;

  @IsNumber()
  @IsOptional()
  totalTransfer?: number;

  @IsNumber()
  @IsOptional()
  amountCustodial?: number;

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
