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
  transaction: Transaction;
  merchant: Merchant;
  card: Card;
  installments: Installments;
  user: User;
  amount: Amount;
  status: string;
  status_detail: string;
  extra_detail: string;
  extra_data: ExtraData;
}

class Adjustment implements ProcessBodyI {
  transaction: Transaction;
  merchant: Merchant;
  card: Card;
  user: User;
  amount: Amount;
}

class Authorization implements ProcessBodyI {
  transaction: Transaction;
  merchant: Merchant;
  card: Card;
  user: User;
  amount: Amount;
  extra_data: ExtraData;
}

export class NotificationDto implements ProcessBodyI {
  event_id: string;
  idempotency_key: string;
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
