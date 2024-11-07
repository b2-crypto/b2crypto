import { IsEnum, IsOptional, IsString } from 'class-validator';
import TypesAccountEnum from '../enum/types.account.enum';
import { AccountCreateDto } from './account.create.dto';
import { ApiProperty } from '@nestjs/swagger';
import WalletTypesAccountEnum from '../enum/wallet.types.account.enum';

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
  @IsOptional()
  @ApiProperty({
    required: false,
    description: 'Wallet pin',
  })
  pin: string;
}
