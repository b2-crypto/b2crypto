import { AddressUserCard } from '@account/account/entities/mongoose/user-card.schema';
import { IsOptional, IsString } from 'class-validator';

export class LegalAddress {
  street_name: string;
  street_number: string;
  floor: string;
  apartment: string;
  zip_code: string;
  neighborhood: string;
  city: string;
  region: string;
  additional_info: string;
  country: string;
}

export class UserCardDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  surname?: string;

  @IsString()
  @IsOptional()
  identification_type?: string;

  @IsString()
  @IsOptional()
  identification_value?: number;

  @IsString()
  @IsOptional()
  birthdate?: string;

  @IsString()
  @IsOptional()
  gender?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  tax_identification_type?: string;

  @IsString()
  @IsOptional()
  tax_identification_value?: number;

  @IsString()
  @IsOptional()
  nationality?: string;

  @IsString()
  @IsOptional()
  legal_address?: AddressUserCard;

  @IsString()
  @IsOptional()
  operation_country?: string;
}
