import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';

class ShippingMeta {
  @IsOptional()
  resource_url: string;
}

export class ShippingNotifications {
  @IsOptional()
  event_id: string;
  @IsOptional()
  shipment_id: string;
  @IsOptional()
  status: string;
  @IsOptional()
  status_detail: string;
  @IsOptional()
  request_status: string;
  @IsOptional()
  updated_at: string;
  @ValidateNested()
  @Type(() => ShippingMeta)
  meta: ShippingMeta;
  @IsOptional()
  idempotency_key: string;
}

export class CardEvents {
  @IsOptional()
  event_id: string;
  @IsOptional()
  id: string;
  @IsOptional()
  updated_at: string;
  @IsOptional()
  user_id: string;
  @IsOptional()
  event: string;
  @IsOptional()
  idempotency_key: string;
}
