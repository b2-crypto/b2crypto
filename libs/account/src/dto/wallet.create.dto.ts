import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumberString,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import TypesAccountEnum from '../enum/types.account.enum';
import WalletTypesAccountEnum from '../enum/wallet.types.account.enum';
import { AccountCreateDto } from './account.create.dto';

export class WalletCreateDto extends AccountCreateDto {
  @IsString()
  type = TypesAccountEnum.WALLET;

  @ApiProperty({
    required: true,
    type: String,
    description: 'Wallet name by user',
  })
  @IsString()
  @IsOptional()
  name: string;

  @ApiProperty({
    required: true,
    type: String,
    description: 'Wallet name by user',
  })
  @IsEnum(WalletTypesAccountEnum)
  @IsOptional()
  accountType: WalletTypesAccountEnum;

  @IsString()
  @IsNumberString()
  @Length(4, 4)
  @IsOptional()
  @ApiProperty({
    required: false,
    description: 'Wallet pin',
  })
  pin: string;
}
