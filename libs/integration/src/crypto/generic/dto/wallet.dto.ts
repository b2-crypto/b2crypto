import { IsNumber, IsOptional, IsString } from 'class-validator';

export class WalletDto {
  @IsString()
  @IsOptional()
  id: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  accountId?: string;

  @IsString()
  @IsOptional()
  accountName?: string;

  @IsString()
  @IsOptional()
  referral?: string;

  @IsString()
  @IsOptional()
  protocol?: string;

  @IsNumber()
  @IsOptional()
  decimals?: number;

  @IsString()
  @IsOptional()
  nativeAccountName?: string;
}
