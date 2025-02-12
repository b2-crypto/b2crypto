import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import TypesAccountEnum from '../enum/types.account.enum';
import { AccountCreateDto } from './account.create.dto';

export class WalletUpsertOneMeDto extends PartialType(AccountCreateDto) {
  @IsString()
  type = TypesAccountEnum.WALLET;

  @ApiProperty({
    required: false,
    description: 'ID Account',
  })
  @IsString()
  accountId: string;
}
