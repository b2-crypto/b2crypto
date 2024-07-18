import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export default class BasicDto {
  @ApiProperty({
    required: false,
    type: String,
    description: 'Name',
  })
  @IsString()
  @IsOptional()
  name: string;

  @ApiProperty({
    required: false,
    type: String,
    description: 'Description',
  })
  @IsString()
  @IsOptional()
  description: string;
}
