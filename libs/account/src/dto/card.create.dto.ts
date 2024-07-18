import { ApiProperty } from '@nestjs/swagger';
import { IsEmpty, IsEnum, IsOptional, IsString } from 'class-validator';
import CardTypesAccountEnum from '../enum/card.types.account.enum';
import TypesAccountEnum from '../enum/types.account.enum';
import { AccountCreateDto } from './account.create.dto';

export class CardCreateDto extends AccountCreateDto {
  @IsString()
  @IsEmpty()
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
}
