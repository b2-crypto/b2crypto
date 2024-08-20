
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import CardTypesAccountEnum from '../enum/card.types.account.enum';
import TypesAccountEnum from '../enum/types.account.enum';
import { AccountCreateDto } from './account.create.dto';

export class CardCreateDto extends AccountCreateDto {
  @IsOptional()
  @ApiProperty({
    required: false,
    type: String,
    description: 'Account Card',
    example: 'CARD',
  })
  @IsString()
  type = TypesAccountEnum.CARD;

  @IsEnum(CardTypesAccountEnum)
  @IsOptional()
  @ApiProperty({
    required: false,
    enum: CardTypesAccountEnum,
    enumName: 'CardTypes',
    description: 'Type of type card',
  })
  accountType: CardTypesAccountEnum;

  @ApiProperty({
    required: true,
    type: String,
    description: 'Card name by user',
  })
  @IsString()
  @IsOptional()
  name: string;

  @IsNumber({ maxDecimalPlaces: 0, allowNaN: false, allowInfinity: false })
  @Min(0)
  @IsOptional()
  @ApiProperty({
    required: false,
    description: 'Account pin',
  })
  pin: number;
}
