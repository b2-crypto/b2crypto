import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, Min, IsEnum } from 'class-validator';
import { NetworkType } from '../enum/networkTypeDto';



export class WalletWithdrawalPreorderDto {
  @ApiProperty({
    description: 'Source wallet address',
    required: true
  })
  @IsNotEmpty()
  @IsString()
  from: string;

  @ApiProperty({
    description: 'Destination blockchain address',
    required: true
  })
  @IsNotEmpty()
  @IsString()
  to: string;

  @ApiProperty({
    description: 'Amount to withdraw',
    required: true,
    minimum: 11
  })
  @IsNumber()
  @Min(11)
  amount: number;

  @ApiProperty({
    description: 'Network for withdrawal',
    required: false,
    enum: NetworkType,
    default: NetworkType.ARBITRUM
  })
  @IsOptional()
  @IsEnum(NetworkType)
  network?: NetworkType;
}