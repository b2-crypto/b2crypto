export interface ApiShippingResult {
  id: string;
  status: string;
  trackingNumber?: string;
  estimatedDeliveryDate?: string;
  carrierInfo?: {
    name: string;
    trackingUrl?: string;
  };
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
