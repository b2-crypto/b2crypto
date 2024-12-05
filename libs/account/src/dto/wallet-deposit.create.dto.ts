import { CreateAnyDto } from '@common/common/models/create-any.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNumber, IsOptional, IsString } from 'class-validator';
import { ObjectId } from 'mongoose';

export class WalletDepositCreateDto extends CreateAnyDto {
  @ApiProperty({
    required: true,
    description: 'Wallet to arrive',
  })
  @IsMongoId()
  to: ObjectId;

  @ApiProperty({
    required: false,
    description: 'Wallet to comes from',
  })
  @IsMongoId()
  @IsOptional()
  @ApiProperty({
    required: false,
    description:
      'Wallet from which it comes. If not specified, assume that it comes from outside the system',
  })
  from?: ObjectId;

  @ApiProperty({
    required: false,
    description: 'Code to execute the transaction',
  })
  @IsString()
  @IsOptional()
  pin: string;

  @ApiProperty({
    required: true,
    description: 'Amount to recharge to the wallet',
  })
  @IsNumber({
    allowNaN: false,
    allowInfinity: false,
  })
  @ApiProperty({
    required: true,
    description: 'Amount to recharge. Must be a positive number',
  })
  amount: number;
}
