import { CommonService } from '@common/common';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RestorePasswordDto {
  @ApiProperty({
    description: 'Email User',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Password User',
    minLength: 6,
    maxLength: 50,
  })
  @IsString()
  @IsOptional()
  @MinLength(6)
  @MaxLength(50)
  @Matches(CommonService.patternPassword, {
    message:
      'The password must have a Uppercase, lowercase letter and a number',
  })
  password: string;

  @ApiProperty({
    description: 'Password User',
    minLength: 6,
    maxLength: 50,
  })
  @IsString()
  @IsOptional()
  @MinLength(6)
  @MaxLength(50)
  @Matches(CommonService.patternPassword, {
    message:
      'The password must have a Uppercase, lowercase letter and a number',
  })
  password2: string;

  @ApiProperty({
    description: 'OTP',
  })
  @IsNumber()
  @IsOptional()
  otp: number;
}
