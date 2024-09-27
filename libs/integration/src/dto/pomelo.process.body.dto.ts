import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class Transaction {
  id: string;
  type: string;
  point_type: string;
  entry_mode: string;
  country_code: string;
  origin: string;
  source: string;
  original_transaction_id: string;
  local_date_time: string;
  created_at: string;
}

class Merchant {
  id: string;
  mcc: string;
  address: string;
  name: string;
}

class Card {
  id: string;
  product_type: string;
  provider: string;
  last_four: string;
}

class Installments {
  quantity: string;
  credit_type: string;
  grace_period: string;
  current_installment: string;
}

class User {
  id: string;
}

class TotalByCurrency {
  total: string;
  currency: string;
}

class Detail {
  type: string;
  currency: string;
  amount: string;
  name: string;
}

class Amount {
  local: TotalByCurrency;
  settlement: TotalByCurrency;
  transaction: TotalByCurrency;
  details: Detail[];
}

class ExtraData {
  cardholder_verification_method: string;
  pin_presence: string;
  pin_validation: string;
  cvv_presence: string;
  cvv_validation: string;
  expiration_date_presence: string;
  expiration_date_validation: string;
  function_code: string;
  tokenization_wallet_name: string;
  tokenization_wallet_id: string;
  cardholder_presence: string;
  card_presence: string;
}

class EventDetail {
  // TODO[hender-2024/07/22] Validate properties
  @IsOptional()
  transaction: Transaction;
  @IsOptional()
  merchant: Merchant;
  @IsOptional()
  card: Card;
  @IsOptional()
  installments: Installments;
  @IsOptional()
  user: User;
  @IsOptional()
  amount: Amount;
  @IsOptional()
  status: string;
  @IsOptional()
  status_detail: string;
  @IsOptional()
  extra_detail: string;
  @IsOptional()
  extra_data: ExtraData;
}

export class Adjustment implements ProcessBodyI {
  @IsOptional()
  transaction: Transaction;
  @IsOptional()
  merchant: Merchant;
  @IsOptional()
  card: Card;
  @IsOptional()
  user: User;
  @IsOptional()
  amount: Amount;
  @IsOptional()
  idempotency?: string;
  @IsOptional()
  installments: Installments;
}

export class Authorization implements ProcessBodyI {
  @IsOptional()
  transaction: Transaction;
  @IsOptional()
  merchant: Merchant;
  @IsOptional()
  card: Card;
  @IsOptional()
  user: User;
  @IsOptional()
  amount: Amount;
  @IsOptional()
  extra_data: ExtraData;
  @IsOptional()
  idempotency?: string;
  @IsOptional()
  installments: Installments;
}

export class NotificationDto implements ProcessBodyI {
  @IsNotEmpty()
  @IsString()
  event_id: string;
  @IsNotEmpty()
  @IsString()
  idempotency_key: string;
  @IsOptional()
  @ValidateNested()
  @Type(() => EventDetail)
  event_detail: EventDetail;
}

export class AdjustmentDto {
  body: Adjustment;
  idempotency: string;
}

export class AuthorizationDto {
  body: Authorization;
  idempotency: string;
}

export interface ProcessBodyI {}
