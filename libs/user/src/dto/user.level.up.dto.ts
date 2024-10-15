import { IsEmpty, IsMongoId, IsOptional } from 'class-validator';
import { ObjectId } from 'mongodb';

export class UserLevelUpDto {
  @IsMongoId()
  @IsOptional()
  id?: ObjectId;
  @IsMongoId()
  level: ObjectId;
  @IsMongoId()
  wallet: ObjectId;
  @IsMongoId()
  @IsEmpty()
  @IsOptional()
  user: ObjectId;
}
