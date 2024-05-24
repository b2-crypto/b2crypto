import CountryCodeEnum from '@common/common/enums/country.code.b2crypto.enum';
import AddressModel from '@common/common/models/AddressModel';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export default class AddressDto implements AddressModel {
  @IsString()
  @IsOptional()
  street_name: string;

  @IsNumber()
  @IsOptional()
  street_number: string;

  @IsNumber()
  @IsOptional()
  floor: string;

  @IsNumber()
  @IsOptional()
  zip_code: string;

  @IsString()
  @IsOptional()
  apartment: string;

  @IsString()
  @IsOptional()
  neighborhood: string;

  @IsString()
  @IsOptional()
  city: string;

  @IsString()
  @IsOptional()
  region: string;

  @IsString()
  @IsOptional()
  additional_info: string;

  @IsEnum(CountryCodeEnum)
  @IsOptional()
  country: CountryCodeEnum;
}
