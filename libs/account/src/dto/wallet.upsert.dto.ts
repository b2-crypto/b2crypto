import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
// import { AssetsEnum } from '../enum/assets.enum';
import TypesAccountEnum from '../enum/types.account.enum';
import { AccountCreateDto } from './account.create.dto';

export class WalletUpsertOneMeDto extends PartialType(AccountCreateDto) {
  @IsString()
  type = TypesAccountEnum.WALLET;

  @ApiProperty({
    required: true,
    description: 'ID Account',
  })
  @IsString()
  accountId: string;

  // @ApiProperty({
  //   required: false,
  //   description: 'Asset Name',
  //   default: AssetsEnum.USDT,
  // })
  // @IsEnum(AssetsEnum)
  // @IsOptional()
  // assetName = AssetsEnum.USDT;
}
