import { IsOptional, IsString } from 'class-validator';

export class ShippingDto {
  @IsString()
  @IsOptional()
  shipment_type: string;

  @IsString()
  @IsOptional()
  affinity_group_id: string;

  @IsString()
  @IsOptional()
  country: string;

  @IsString()
  @IsOptional()
  user_id: string;

  @IsString()
  @IsOptional()
  address: AddressShipping;

  @IsString()
  @IsOptional()
  receiver: ReceiverShipping;
}

export class AddressShipping {
  street_name: string;
  street_number: string;
  city: string;
  region: string;
  neighborhood: string;
  country: string;
  additional_info: string;
}

export interface ReceiverShipping {
  full_name: string;
  email: string;
  document_type: string;
  document_number: string;
  telephone_number: string;
}
