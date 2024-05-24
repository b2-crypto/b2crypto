import { CreateAnyDto } from '@common/common/models/create-any.dto';
import {
  IsArray,
  IsDate,
  IsDateString,
  IsEmpty,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ObjectId } from 'mongodb';
import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import TelephoneDto from './telephone.dto';
import LocationDto from './location.dto';
import DocIdTypeEnum from '@common/common/enums/DocIdTypeEnum';
import GenderEnum from '@common/common/enums/GenderEnum';
import CountryCodeEnum from '@common/common/enums/country.code.b2crypto.enum';

export class PersonCreateDto extends CreateAnyDto {
  @ApiProperty({
    description: 'Person number of document id',
  })
  @IsString()
  numDocId: string;

  @ApiProperty({
    description: 'Person number of document id',
  })
  @IsString()
  @IsEnum(DocIdTypeEnum)
  typeDocId: DocIdTypeEnum;

  @ApiProperty({
    description: 'Person name',
  })
  @IsString()
  firstName: string;

  @IsEmpty()
  name: string;

  @ApiProperty({
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
    description: 'Emails arrayList',
    isArray: true,
  })
  @IsArray()
  @IsOptional()
  @ValidateIf((o) => !o.email || typeof o.email !== 'string')
  @Transform(({ value }) => (Array.isArray(value) ? value : undefined))
  emails: string[];

  @ApiProperty({
    description: 'One email to emails',
  })
  @IsString()
  @IsOptional()
  @ValidateIf((o) => !o.emails || !Array.isArray(o.emails))
  @Transform(({ value }) => (value ? value.toString() : value))
  email: string;

  @ApiProperty({
    description: 'Person telephones arrayList',
    isArray: true,
  })
  @IsArray()
  @IsOptional()
  @IsObject({ each: true })
  @Type(() => TelephoneDto)
  telephones: TelephoneDto[];

  @ApiProperty({
    description: 'PhoneNumber to telephones',
  })
  @IsString()
  @IsOptional()
  phoneNumber: string;

  @ApiProperty({
    description: 'Person location',
  })
  @IsObject()
  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;

  @ApiProperty({
    description: 'The country to location',
  })
  @IsEnum(CountryCodeEnum)
  country: CountryCodeEnum;
  //job :JobModel,
  //birth :BirthModel,
  //gender :GenderEnum,
  //kyc :KyCModel,

  @ApiProperty({
    description: 'User ID',
  })
  @IsMongoId()
  user: ObjectId;
}
