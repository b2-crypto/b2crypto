export class ShippingResult implements ShippingResultInterface {
  id: string;
  external_tracking_id: string;
  status: string;
  status_detail: string;
  shipment_type: string;
  affinity_group_id: string;
  affinity_group_name: string;
  courier: Courier;
  country_code: string;
  created_at: string;
  batch: BatchShippingResult;
  address: AddressShippingResult;
  receiver: ReceiverShippingResult;
  user_id: string;
}
export interface ShippingResultInterface {
  id: string;
  external_tracking_id: string;
  status: string;
  status_detail: string;
  shipment_type: string;
  affinity_group_id: string;
  affinity_group_name: string;
  courier: Courier;
  country_code: string;
  created_at: string;
  batch: BatchShippingResult;
  address: AddressShippingResult;
  receiver: ReceiverShippingResult;
  user_id: string;
}

export interface Courier {
  company: string;
  tracking_url: string;
}

export interface BatchShippingResult {
  id: string;
  quantity: number;
  has_stock: boolean;
  status: string;
}

export interface AddressShippingResult {
  street_name: string;
  street_number: string;
  floor: string;
  apartment: string;
  city: string;
  region: string;
  country: string;
  zip_code: string;
  neighborhood: string;
  additional_info: string;
}

export interface ReceiverShippingResult {
  full_name: string;
  email: string;
  document_type: string;
  document_number: string;
  tax_identification_number: string;
  telephone_number: string;
}
