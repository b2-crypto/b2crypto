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

export default class LocationDto implements LocationModel {
  @IsString()
  @IsNotEmpty()
  name: string;

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

  @IsString()
  @IsOptional()
  city!: string;

  @IsOptional()
  @IsEnum(CountryCodeEnum)
  country: CountryCodeEnum;

  @IsOptional()
  @IsMongoId()
  countryId!: ObjectId;

  @IsObject()
  @IsOptional()
  @Type(() => BasicDto)
  address!: AddressDto;

  @IsObject()
  @IsOptional()
  @Type(() => BasicDto)
  street!: BasicDto;

  @IsString()
  @IsOptional()
  zipcode!: string;

  @IsObject()
  @IsOptional()
  @Type(() => GeopointDto)
  geopoint!: GeopointDto;
}
