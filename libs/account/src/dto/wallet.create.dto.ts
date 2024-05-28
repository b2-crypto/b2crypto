import { IsString } from 'class-validator';
import TypesAccountEnum from '../enum/types.account.enum';
import { AccountCreateDto } from './account.create.dto';

export class WalletCreateDto extends AccountCreateDto {
  @IsString()
  type = TypesAccountEnum.WALLET;
}
