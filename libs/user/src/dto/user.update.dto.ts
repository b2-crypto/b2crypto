import { PartialType } from '@nestjs/mapped-types';
import { ObjectId } from 'mongodb';
import { UserCreateDto } from '@user/user/dto/user.create.dto';
import { IsBoolean, IsMongoId, IsOptional, IsString } from 'class-validator';

export class UserUpdateDto extends PartialType(UserCreateDto) {
  @IsMongoId()
  id: ObjectId;

  @IsBoolean()
  @IsOptional()
  verifyIdentity?: boolean;

  @IsString()
  @IsOptional()
  verifyIdentityLevelName?: string;

  @IsBoolean()
  @IsOptional()
  verifyEmail?: boolean;
}
