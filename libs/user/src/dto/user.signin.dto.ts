import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UserSignInDto {
  @ApiProperty({
    description: 'Password User',
    minLength: 6,
    maxLength: 50,
  })
  @IsString()
  @MinLength(6)
  @IsOptional()
  @MaxLength(50)
  password: string;

  @ApiProperty({
    description: 'Email User',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
