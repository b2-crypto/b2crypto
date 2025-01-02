import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsNumber, Min, IsOptional } from "class-validator";

export class WalletWithdrawalDto {
    @ApiProperty({
      description: 'Source wallet ID',
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
      description: 'Network for withdrawal (TRC20 or ERC20)',
      required: false,
      enum: ['TRC20', 'ERC20']
    })
    @IsOptional()
    @IsString()
    network?: string;
}