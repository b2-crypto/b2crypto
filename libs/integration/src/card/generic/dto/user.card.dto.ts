import { IsOptional, IsString } from 'class-validator';

export class UserCardDto {
  @IsString()
  @IsOptional()
  id: string;

  @IsString()
  @IsOptional()
  name: string;

  @IsString()
  @IsOptional()
  surname: string;

  @IsString()
  @IsOptional()
  identification_type: string;

  @IsString()
  @IsOptional()
  identification_value: number;

  @IsString()
  @IsOptional()
  birthdate: string;

  @IsString()
  @IsOptional()
  gender: string;

  @IsString()
  @IsOptional()
  email: string;

  @IsString()
  @IsOptional()
  phone: string;

  @IsString()
  @IsOptional()
  tax_identification_type: string;

  @IsString()
  @IsOptional()
  tax_identification_value: number;

  @IsString()
  @IsOptional()
  nationality: string;

  @IsString()
  @IsOptional()
  legal_address: LegalAddress;

  @IsString()
  @IsOptional()
  operation_country: string;
}

export class LegalAddress {
  street_name: string;
  street_number: number;
  floor: number;
  apartment: string;
  zip_code: number;
  neighborhood: string;
  city: string;
  region: string;
  additional_info: string;
  country: string;
}
