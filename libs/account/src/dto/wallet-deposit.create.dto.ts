import { CreateAnyDto } from '@common/common/models/create-any.dto';
import { IsMongoId, IsNumber, IsOptional, IsString } from 'class-validator';
import { ObjectId } from 'mongoose';

export class WalletDepositCreateDto extends CreateAnyDto {
  @IsMongoId()
  to: ObjectId;

  @IsMongoId()
  @IsOptional()
  from?: ObjectId;

  @IsString()
  @IsOptional()
  pin: string;

  @IsNumber({
    allowNaN: false,
    allowInfinity: false,
  })
  amount: number;
}
