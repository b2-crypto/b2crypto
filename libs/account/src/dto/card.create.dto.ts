import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString, Min } from 'class-validator';
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

  @IsOptional()
  @IsBoolean()
  force = false;

  @IsEnum(CardTypesAccountEnum)
  @IsOptional()
  @ApiProperty({
    required: false,
    enum: CardTypesAccountEnum,
    enumName: 'CardTypes',
    description: 'Type of type card',
    default: CardTypesAccountEnum.VIRTUAL,
  })
  accountType: CardTypesAccountEnum = CardTypesAccountEnum.VIRTUAL;

  @ApiProperty({
    required: true,
    type: String,
    description: 'Card name by user',
  })
  @IsString()
  @IsOptional()
  name: string;

  @IsString()
  @Min(0)
  @IsOptional()
  @ApiProperty({
    required: false,
    description: 'Card pin',
  })
  pin: string;
}
