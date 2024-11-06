import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsNumber } from 'class-validator';
import { ObjectId } from 'mongodb';
import { AccountCreateDto } from './account.create.dto';

export class PinUpdateDto extends PartialType(AccountCreateDto) {
  @IsNotEmpty()
  @IsMongoId()
  @ApiProperty({
    required: true,
    description: '',
    example: ['664dcd1529dabb0380754c73'],
  })
  id: ObjectId;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty({
    required: true,
    description: 'PIN to update. No sequence or repeat numbers',
    example: ['1234'],
  })
  pin?: number;
}
