import { PersonUpdateDto } from '@person/person/dto/person.update.dto';
import { UserChangePasswordDto } from './user.change-password.dto';
import { Type } from 'class-transformer';
import { ObjectId } from 'mongodb';
import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsIP,
  IsJSON,
  IsMongoId,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { UserCardDto } from '@integration/integration/card/generic/dto/user.card.dto';

export class UserCreateDto extends UserChangePasswordDto {
  @IsString()
  @IsOptional()
  name: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsEmail()
  email: string;

  @IsBoolean()
  @IsNotEmpty()
  active = false;

  @IsBoolean()
  @IsNotEmpty()
  individual = true;

  @IsMongoId()
  role: ObjectId;

  @IsMongoId()
  @IsOptional()
  image: ObjectId;

  @IsMongoId({ each: true })
  @IsOptional()
  affiliate: ObjectId[];

  @IsArray()
  @IsOptional()
  @IsIP(4, { each: true })
  ipAddress: string[];

  @IsMongoId()
  @IsOptional()
  personalData: ObjectId;

  @IsJSON()
  @IsOptional()
  configuration: JSON;

  @IsString()
  @IsOptional()
  twoFactorSecret: string;

  @IsString()
  @IsOptional()
  twoFactorQr: string;

  @IsObject()
  @Type(() => UserCardDto)
  @IsOptional()
  userCard?: UserCardDto;

  @IsBoolean()
  @IsOptional()
  twoFactorIsActive: boolean;

  @IsArray()
  @IsOptional()
  @IsMongoId({ each: true })
  permissions: Array<ObjectId>;
}
