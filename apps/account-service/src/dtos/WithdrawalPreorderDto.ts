import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, IsEnum, Min } from 'class-validator';
import { NetworkEnum } from '../enum/network.enum';


export class WithdrawalPreorderDto {
  @ApiProperty({
    description: 'Asset identifier (e.g., BTC, ETH)',
    example: 'BTC'
  })
  @IsNotEmpty()
  @IsString()
  assetId: string;

  @ApiProperty({
    description: 'Amount to withdraw',
    example: 0.1,
    minimum: 0
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({
    description: 'Destination address for the withdrawal',
    example: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
  })
  @IsNotEmpty()
  @IsString()
  destinationAddress: string;

  @ApiProperty({
    description: 'Network for the withdrawal',
    enum: NetworkEnum,
    example: NetworkEnum.ARBITRUM
  })
  @IsNotEmpty()
  @IsEnum(NetworkEnum)
  networkId: NetworkEnum;
}