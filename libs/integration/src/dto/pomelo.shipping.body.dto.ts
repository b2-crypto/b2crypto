import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';

class ShippingMeta {
  @IsNotEmpty()
  @IsString()
  resource_url: string;
}

export class ShippingNotifications {
  @IsNotEmpty()
  @IsString()
  event_id: string;
  @IsNotEmpty()
  @IsString()
  shipment_id: string;
  @IsNotEmpty()
  @IsString()
  status: string;
  @IsNotEmpty()
  @IsString()
  status_detail: string;
  @IsNotEmpty()
  @IsString()
  updated_at: string;
  @ValidateNested()
  @Type(() => ShippingMeta)
  meta: ShippingMeta;
  @IsNotEmpty()
  @IsString()
  idempotency_key: string;
}

export class CardEvents {
  @IsNotEmpty()
  @IsString()
  event_id: string;
  @IsNotEmpty()
  @IsString()
  id: string;
  @IsNotEmpty()
  @IsString()
  updated_at: string;
  @IsNotEmpty()
  @IsString()
  user_id: string;
  @IsNotEmpty()
  @IsString()
  event: string;
  @IsNotEmpty()
  @IsString()
  idempotency_key: string;
}
