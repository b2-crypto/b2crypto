import { CreateAnyDto } from '@common/common/models/create-any.dto';
import { IsMongoId, IsNumber, IsOptional, IsString } from 'class-validator';
import { ObjectId } from 'mongoose';

export class BankDepositCreateDto extends CreateAnyDto {
  @IsMongoId()
  id: ObjectId;

  @IsMongoId()
  @IsOptional()
  from?: ObjectId;

  @IsString()
  pin: string;

  @IsNumber({
    allowNaN: false,
    allowInfinity: false,
  })
  amount: number;
}
