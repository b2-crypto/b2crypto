import CountryCodeEnum from '@common/common/enums/country.code.b2crypto.enum';
import LocationModel from '@common/common/models/LocationModel';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { ObjectId } from 'mongodb';
import AddressDto from './address.dto';
import BasicDto from './basic.dto';
import GeopointDto from './geopoint.dto';
import { ApiProperty } from '@nestjs/swagger';

export default class LocationDto implements LocationModel {
  @ApiProperty({
    required: true,
    type: String,
    description: 'Name of location',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    required: false,
    type: String,
    description: 'Description of location',
  })
  @IsString()
  @IsOptional()
  description!: string;

  @IsMongoId()
  @IsOptional()
  category!: ObjectId;

  @IsObject()
  @IsOptional()
  @Type(() => BasicDto)
  colony!: BasicDto;

  @ApiProperty({
    required: false,
    type: String,
    description: 'City of location',
  })
  @IsString()
  @IsOptional()
  city!: string;

  @ApiProperty({
    required: false,
    enum: CountryCodeEnum,
    enumName: 'CountryCode',
    description: 'Country of location',
  })
  @IsOptional()
  @IsEnum(CountryCodeEnum)
  country: CountryCodeEnum;

  @IsOptional()
  @IsMongoId()
  countryId!: ObjectId;

  @ApiProperty({
    required: false,
    type: AddressDto,
    description: 'Address of location',
  })
  @IsObject()
  @IsOptional()
  @Type(() => AddressDto)
  address!: AddressDto;

  @ApiProperty({
    required: false,
    type: BasicDto,
    description: 'Street of location',
  })
  @IsObject()
  @IsOptional()
  @Type(() => BasicDto)
  street!: BasicDto;

  @ApiProperty({
    required: false,
    type: String,
    description: 'Zipcode of location',
  })
  @IsString()
  @IsOptional()
  zipcode!: string;

  @ApiProperty({
    required: false,
    type: GeopointDto,
    description: 'Geopoint of location',
  })
  @IsObject()
  @IsOptional()
  @Type(() => GeopointDto)
  geopoint!: GeopointDto;
}
