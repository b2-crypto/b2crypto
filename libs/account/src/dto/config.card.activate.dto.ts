import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ConfigCardActivateDto {
  @ApiProperty({
    required: true,
    description: 'Card number',
    example: '5268080005638854',
  })
  @IsString()
  @IsNotEmpty()
  pan: string;

  @ApiProperty({
    required: false,
    description: 'Pin card. 4 digits',
    example: '1425',
  })
  @IsString()
  @IsOptional()
  pin?: string;

  @ApiProperty({
    required: false,
    description: 'Promotional code',
    example: '14A25F',
  })
  @IsString()
  @IsOptional()
  promoCode?: string;

  @ApiProperty({
    required: false,
    description: 'Prev card id',
    example: '664dcd1529dabb0380754c73',
  })
  @IsString()
  @IsOptional()
  prevCardId?: string;
}
