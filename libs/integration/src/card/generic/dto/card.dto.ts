import { Type } from 'class-transformer';
import { IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class CardSearchDto {
  @IsString()
  @IsOptional()
  user_id: string;
  @IsNumber()
  @IsOptional()
  page_size: number;
}

export class CardDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  @IsOptional()
  user_id?: string;

  @IsString()
  @IsOptional()
  affinity_group_id?: string;

  @IsString()
  @IsOptional()
  card_type?: string;

  @IsString()
  @IsObject({})
  @Type(() => Address)
  address?: Address;

  @IsString()
  @IsOptional()
  previous_card_id?: string;

  @IsString()
  @IsOptional()
  pin?: string;

  @IsString()
  @IsOptional()
  name_on_card?: string;

  @IsString()
  @IsOptional()
  email?: string;
}

export class Address {
  street_name: string;
  street_number: string;
  floor: string;
  apartment: string;
  city: string;
  region: string;
  country: string;
  zip_code: string;
  neighborhood: string;
}
