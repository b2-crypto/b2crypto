import { IsEmpty } from 'class-validator';
import TypesAccountEnum from '../enum/types.account.enum';
import { AccountCreateDto } from './account.create.dto';

export class CardCreateDto extends AccountCreateDto {
  @IsEmpty()
  type = TypesAccountEnum.CARD;
}
