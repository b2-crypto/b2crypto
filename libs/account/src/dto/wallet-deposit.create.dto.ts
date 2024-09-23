import { CreateAnyDto } from '@common/common/models/create-any.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNumber, IsOptional, IsString } from 'class-validator';
import { ObjectId } from 'mongoose';

export class WalletDepositCreateDto extends CreateAnyDto {
  @IsMongoId()
  @ApiProperty({
    required: true,
    description: 'Wallet to which it arrives',
  })
  to: ObjectId;

  @IsMongoId()
  @IsOptional()
  @ApiProperty({
    required: false,
    description:
      'Wallet from which it comes. If not specified, assume that it comes from outside the system',
  })
  from?: ObjectId;

  @IsString()
  @IsOptional()
  pin: string;

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
