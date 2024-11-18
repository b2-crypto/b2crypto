export interface CardIntegrationConfig {
    id: string;
    user_id: string;
    affinity_group_id: string;
    card_type: string;
    status: string;
    start_date: string;
    last_four: string;
    provider: string;
    product_type: string;
    address: CardAddress;
}

export interface CardAddress {
    street_name: string;
    street_number?: string;
    floor?: string;
    apartment?: string;
    city: string;
    region: string;
    country: string;
    zip_code?: string;
    neighborhood?: string;
}

export interface CardUserProfile {
    name: string;
    surname: string;
    identification_type: string;
    identification_value: string;
    birthdate: string;
    gender: string;
    email: string;
    phone: string;
    nationality: string;
    legal_address: CardAddress;
    operation_country: string;
    zip_code: string;
}

export interface CardShippingInfo {
    shipment_type: string;
    affinity_group_id: string;
    country: string;
    user_id: string;
    address: CardAddress;
    receiver: {
        full_name: string;
        email: string;
        document_type: string;
        document_number: string;
        telephone_number: string;
    };
}