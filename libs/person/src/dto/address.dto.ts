import CountryCodeEnum from '@common/common/enums/country.code.b2crypto.enum';
import AddressModel from '@common/common/models/AddressModel';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export default class AddressDto implements AddressModel {
  @ApiProperty({
    required: false,
    type: String,
    description: 'Street name',
  })
  @IsString()
  @IsOptional()
  street_name: string;

  @ApiProperty({
    required: false,
    type: String,
    description: 'Street number',
  })
  @IsString()
  @IsOptional()
  street_number: string;

  @ApiProperty({
    required: false,
    type: String,
    description: 'Floor',
  })
  @IsString()
  @IsOptional()
  floor: string;

  @ApiProperty({
    required: false,
    type: String,
    description: 'Zip code',
  })
  @IsString()
  @IsOptional()
  zip_code: string;

  @ApiProperty({
    required: false,
    type: String,
    description: 'Apartment name or number',
  })
  @IsString()
  @IsOptional()
  apartment: string;

  @ApiProperty({
    required: false,
    type: String,
    description: 'Neighborhood name',
  })
  @IsString()
  @IsOptional()
  neighborhood: string;

  @ApiProperty({
    required: false,
    type: String,
    description: 'City address',
  })
  @IsString()
  @IsOptional()
  city: string;

  @ApiProperty({
    required: false,
    type: String,
    description: 'Region address',
  })
  @IsString()
  @IsOptional()
  region: string;

  @ApiProperty({
    required: false,
    type: String,
    description: 'Additional info',
  })
  @IsString()
  @IsOptional()
  additional_info: string;

  @ApiProperty({
    required: false,
    enum: CountryCodeEnum,
    enumName: 'CountryCode',
    description: 'Country code',
  })
  @IsEnum(CountryCodeEnum)
  @IsOptional()
  country: CountryCodeEnum | string;
}
