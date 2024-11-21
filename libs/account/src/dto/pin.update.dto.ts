import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';
import { ObjectId } from 'mongodb';

export class PinUpdateDto {
  @IsNotEmpty()
  @IsMongoId()
  @ApiProperty({
    required: true,
    description: '',
    example: ['664dcd1529dabb0380754c73'],
  })
  id: ObjectId;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    required: true,
    description: 'PIN to update. No sequence or repeat numbers',
    example: ['1234'],
  })
  pin?: string;

  /*@IsNotEmpty()
  @IsString()
  @ApiProperty({
    required: true,
    description: 'PIN before update',
    example: ['1234'],
  })
  oldPin: string;*/
}
