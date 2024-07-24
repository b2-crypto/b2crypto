import DocIdTypeEnum from '@common/common/enums/DocIdTypeEnum';
import GenderEnum from '@common/common/enums/GenderEnum';
import CountryCodeEnum from '@common/common/enums/country.code.b2crypto.enum';
import { CreateAnyDto } from '@common/common/models/create-any.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEmpty,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ObjectId } from 'mongodb';
import LocationDto from './location.dto';
import TelephoneDto from './telephone.dto';

export class PersonCreateDto extends CreateAnyDto {
  @ApiProperty({
    required: true,
    description: 'Person number of document id',
  })
  @IsString()
  numDocId: string;

  @ApiProperty({
    required: true,
    enum: DocIdTypeEnum,
    enumName: 'DocIdType',
    description: 'Person number of document id',
  })
  @IsString()
  @IsEnum(DocIdTypeEnum)
  typeDocId: DocIdTypeEnum;

  @ApiProperty({
    required: true,
    description: 'Person name',
  })
  @IsString()
  firstName: string;

  @IsEmpty()
  name: string;

  @ApiProperty({
    required: false,
    description: 'Person description',
  })
  @IsString()
  @IsOptional()
  description: string;

  @ApiProperty({
    description: 'person lastName',
    default: '',
  })
  @IsString()
  lastName: string;
  @ApiProperty({
    required: true,
    enum: GenderEnum,
    enumName: 'Gender',
    description: 'The gender person',
  })
  @IsEnum(GenderEnum)
  gender: GenderEnum;

  @IsEnum(CountryCodeEnum)
  @IsOptional()
  nationality: CountryCodeEnum;

  @IsOptional()
  @IsString()
  taxIdentificationType: string;

  @IsOptional()
  @IsNumber()
  taxIdentificationValue: number;

  @IsDate()
  birth: Date;

  @ApiProperty({
    required: false,
    description: 'Emails arrayList',
    isArray: true,
  })
  @IsArray()
  @IsOptional()
  @ValidateIf((o) => !o.email || typeof o.email !== 'string')
  @Transform(({ value }) => (Array.isArray(value) ? value : undefined))
  emails: string[];

  @ApiProperty({
    required: false,
    type: String,
    description: 'One email to emails',
  })
  @IsString()
  @IsOptional()
  @ValidateIf((o) => !o.emails || !Array.isArray(o.emails))
  @Transform(({ value }) => (value ? value.toString() : value))
  email: string;

  @ApiProperty({
    required: false,
    description: 'Person telephones arrayList',
    isArray: true,
  })
  @IsArray()
  @IsOptional()
  @IsObject({ each: true })
  @Type(() => TelephoneDto)
  telephones: TelephoneDto[];

  @ApiProperty({
    required: false,
    description: 'PhoneNumber to telephones',
  })
  @IsString()
  @IsOptional()
  phoneNumber: string;

  @ApiProperty({
    required: false,
    type: LocationDto,
    description: 'Person location',
  })
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @ApiProperty({
    required: true,
    enum: CountryCodeEnum,
    enumName: 'CountryCode',
    description: 'The country person lives in',
  })
  @IsEnum(CountryCodeEnum)
  country: CountryCodeEnum;
  //job :JobModel,
  //birth :BirthModel,
  //gender :GenderEnum,
  //kyc :KyCModel,

  @ApiProperty({
    required: true,
    description: 'User ID',
  })
  @IsOptional()
  @IsMongoId()
  user: ObjectId;
}
