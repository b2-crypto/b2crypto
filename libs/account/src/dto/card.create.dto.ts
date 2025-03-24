import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
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

  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
    description: 'Card pin',
  })
  pin: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
    type: String,
    description: 'ID of the account to use for payment',
    example: '6098a54b2c365f0012d7c457',
  })
  fromAccountId: string;
}