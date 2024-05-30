import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class Attributes {
  @IsNumber()
  status: number;
  address: any;

  @IsString()
  address_type: string;

  @IsString()
  label: string;

  @IsString()
  tracking_id: string;

  @IsNumber()
  confirmations_needed: number;

  time_limit: any;

  @IsString()
  callback_url: string;

  @IsString()
  inaccuracy: string;

  target_amount_requested: any;

  rate_requested: any;

  rate_expired_at: any;

  invoice_updated_at: any;

  @IsString()
  payment_page: string;

  @IsString()
  target_paid: string;

  @IsString()
  source_amount_requested: string;

  @IsString()
  target_paid_pending: string;

  assets: any;

  destination: any;
}

export class Currency {
  data: any;
}

export class DataWallet {
  @IsString()
  type: string;

  @IsString()
  id: string;
}

export class Wallet {
  data: DataWallet;
}

export class Relationships {
  @ValidateNested()
  @Type(() => Currency)
  currency: Currency;

  @ValidateNested()
  @Type(() => Wallet)
  wallet: Wallet;
}

export class DataTransferAccountResponse {
  @IsString()
  type: string;

  @IsString()
  id: string;

  @ValidateNested()
  @Type(() => Attributes)
  attributes: Attributes;

  @ValidateNested()
  @Type(() => Relationships)
  relationships: Relationships;
}

export class TransferAccountResponse {
  data: DataTransferAccountResponse;
}
