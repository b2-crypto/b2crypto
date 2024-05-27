import { IsString } from 'class-validator';
import TypesAccountEnum from '../enum/types.account.enum';
import { AccountCreateDto } from './account.create.dto';

export class CardCreateDto extends AccountCreateDto {
  @IsString()
  type = TypesAccountEnum.CARD;
}
