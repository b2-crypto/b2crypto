import TypesAccountEnum from '@account/account/enum/types.account.enum';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class TransferCreateButtonDto {
  @IsString()
  @IsOptional()
  identifier: string;

  @IsString()
  currency: string;

  @IsString()
  @IsNotEmpty()
  amount: string;

  @IsString()
  details: string;

  @IsString()
  @IsOptional()
  cancel_url?: string;

  @IsString()
  @IsOptional()
  success_url?: string;

  @IsString()
  @IsOptional()
  public_key?: string;

  @IsString()
  @IsOptional()
  site_logo?: string;

  @IsString()
  @IsOptional()
  checkout_theme?: string;

  @IsString()
  @IsNotEmpty()
  customer_name: string;

  @IsString()
  @IsNotEmpty()
  customer_email: string;

  @IsString()
  @IsOptional()
  account?: string;

  @IsString()
  @IsOptional()
  typeAccount?: TypesAccountEnum;

  @IsString()
  @IsOptional()
  typeAccountType?: string;

  @IsString()
  @IsOptional()
  creator?: string;

  @IsString()
  @IsOptional()
  host?: string;
}
