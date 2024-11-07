import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEmpty,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ObjectId } from 'mongodb';

export class UserPreRegisterDto {
  @ApiProperty({
    description: 'Start active User',
  })
  @IsBoolean()
  active = false;

  @ApiProperty({
    description: 'If User is individual or corporate',
  })
  @IsBoolean()
  individual = true;

  @ApiProperty({
    description: 'Campaign of User register',
  })
  @IsOptional()
  @IsString()
  campaign: string;

  @IsEmpty()
  description: string;

  @ApiProperty({
    description: 'Email User',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsEmail()
  slugEmail: string;

  @IsOptional()
  @IsString()
  phone: string;

  @ApiProperty({
    description: 'Name User',
  })
  @IsString()
  @IsOptional()
  name: string;

  @IsString()
  @IsOptional()
  username: string;

  @IsString()
  @IsOptional()
  slugUsername: string;

  @IsMongoId()
  @IsOptional()
  role?: ObjectId;

  @IsString()
  @IsOptional()
  apiKey?: string;

  @IsEmpty()
  twoFactorQr: string;

  @IsEmpty()
  twoFactorSecret: string;

  @IsEmpty()
  brand: ObjectId;

  @IsOptional()
  twoFactorIsActive = false;

  @IsBoolean()
  @IsOptional()
  verifyEmail: boolean;
}
