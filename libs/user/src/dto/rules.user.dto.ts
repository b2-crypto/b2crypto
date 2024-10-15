import { IsOptional, IsString } from 'class-validator';

export class RulesUserDto {
  @IsString()
  @IsOptional()
  _id: string;

  @IsString()
  @IsOptional()
  name: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsString()
  @IsOptional()
  valueNumber: string;

  @IsString()
  @IsOptional()
  valueText: string;
}
