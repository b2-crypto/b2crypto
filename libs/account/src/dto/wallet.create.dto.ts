import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import TypesAccountEnum from '../enum/types.account.enum';
import { AccountCreateDto } from './account.create.dto';
import { ApiProperty } from '@nestjs/swagger';

export class WalletCreateDto extends AccountCreateDto {
  @IsString()
  type = TypesAccountEnum.WALLET;

  @ApiProperty({
    required: true,
    type: String,
    description: 'Card name by user',
  })
  @IsString()
  @IsOptional()
  name: string;

  @IsNumber({ maxDecimalPlaces: 0, allowNaN: false, allowInfinity: false })
  @Min(0)
  @IsOptional()
  @ApiProperty({
    required: false,
    description: 'Account pin',
  })
  pin: number;
}
