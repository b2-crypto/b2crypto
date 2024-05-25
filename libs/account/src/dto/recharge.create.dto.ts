import { CreateAnyDto } from '@common/common/models/create-any.dto';
import { IsMongoId, IsNumber } from 'class-validator';
import { ObjectId } from 'mongoose';

export class RechargeCreateDto extends CreateAnyDto {
  @IsMongoId()
  id: ObjectId;

  @IsNumber({
    allowNaN: false,
    allowInfinity: false,
  })
  amount: number;
}
