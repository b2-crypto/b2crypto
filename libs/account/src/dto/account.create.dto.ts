import { CategoryUpdateDto } from '@category/category/dto/category.update.dto';
import CountryCodeEnum from '@common/common/enums/country.code.b2crypto.enum';
import { CreateAnyDto } from '@common/common/models/create-any.dto';
import { ApiProperty } from '@nestjs/swagger';
import AddressDto from '@person/person/dto/address.dto';
import { PersonCreateDto } from '@person/person/dto/person.create.dto';
import { StatusInterface } from '@status/status/entities/status.interface';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEmpty,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ObjectId } from 'mongodb';
import { AccountInterface } from '../entities/account.interface';
import TypesAccountEnum from '../enum/types.account.enum';

export class AccountCreateDto extends CreateAnyDto implements AccountInterface {
  _id?: ObjectId;
  id: ObjectId;
  slug: string;
  @ApiProperty({
    required: true,
    type: String,
    description: 'Account name by user',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(TypesAccountEnum)
  @IsNotEmpty()
  @ApiProperty({
    required: true,
    enum: TypesAccountEnum,
    enumName: 'TypesAccount',
    description: 'Type account (Bank, E-Wallet, Card)',
  })
  type: TypesAccountEnum;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    required: true,
    type: String,
    description: 'Type of type account',
  })
  accountType: string;

  @ApiProperty({
    required: false,
    type: String,
    description: 'Param firstName',
  })
  firstName?: string;

  @ApiProperty({
    required: false,
    type: String,
    description: 'Param lastName',
  })
  lastName?: string;

  @IsEmpty()
  searchText: string;

  @ApiProperty({
    required: false,
    description: 'Account DocId',
  })
  @IsOptional()
  docId: string;

  @IsString()
  @IsOptional()
  secret: string;

  @IsNumber({ maxDecimalPlaces: 0, allowNaN: false, allowInfinity: false })
  @ApiProperty({
    required: false,
    description: 'Account pin',
  })
  pin: number;

  @ApiProperty({
    description: 'Account DocId',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @ApiProperty({
    description: 'Account email',
  })
  @IsOptional()
  email: string;

  @ApiProperty({
    description: 'Account telephone',
  })
  @IsOptional()
  telephone: string;

  @ApiProperty({
    description: 'Account description',
  })
  @IsString()
  @IsOptional()
  description: string;

  @ApiProperty({
    required: false,
    description: 'ID Account',
  })
  @IsString()
  @IsOptional()
  accountId?: string;

  @ApiProperty({
    required: false,
    description: 'Tecnical account name',
  })
  @IsString()
  @IsOptional()
  accountName?: string;

  @IsBoolean()
  @IsOptional()
  hasSendDisclaimer = false;

  @ApiProperty({
    required: false,
    description: 'Account password',
  })
  @IsString()
  @IsOptional()
  accountPassword?: string;

  @IsEmpty()
  accountDepartment?: ObjectId;

  @ApiProperty({
    required: false,
    description: 'Account referral',
  })
  @IsString()
  @IsOptional()
  referral: string;

  //@IsEmpty()
  @IsOptional()
  owner?: ObjectId;

  @ApiProperty({
    description: 'Account country',
  })
  @IsEnum(CountryCodeEnum)
  @IsOptional()
  country: CountryCodeEnum;

  @ApiProperty({
    required: false,
    example: 'GOOGLE',
    description: 'Account referral type',
  })
  @IsString()
  @IsOptional()
  referralType: string;

  @IsEmpty()
  referralTypeObj?: CategoryUpdateDto;

  @IsEmpty()
  totalPayed?: number;

  @IsOptional()
  @IsMongoId()
  group?: ObjectId;

  @IsOptional()
  @IsMongoId()
  status?: ObjectId;

  @IsArray()
  @IsOptional()
  @IsMongoId({ each: true })
  statusCrm?: ObjectId[];

  @IsOptional()
  @ValidateNested()
  @Type(() => PersonCreateDto)
  personalData: ObjectId;

  @IsOptional()
  @IsMongoId()
  user?: ObjectId;

  @IsMongoId({ each: true })
  @IsOptional()
  pspsUsed?: ObjectId[];

  @IsOptional()
  @IsMongoId()
  crm: ObjectId;

  @IsOptional()
  @IsMongoId()
  brand: ObjectId;

  @IsOptional()
  @IsMongoId()
  affiliate: ObjectId;

  @ApiProperty({
    required: false,
    type: String,
    description: 'Param userIp',
  })
  @IsString()
  @IsOptional()
  userIp?: string;

  @ApiProperty({
    required: false,
    type: String,
    description: 'Param funnelName',
  })
  @IsString()
  @IsOptional()
  sourceId?: string;

  @IsEmpty()
  responseCreation?: any;
  @IsEmpty()
  responseShipping?: any;
  @IsEmpty()
  totalTransfer: number;
  @IsEmpty()
  quantityTransfer: number;
  @IsEmpty()
  showToAffiliate: boolean;
  @IsEmpty()
  accountStatus: StatusInterface[];
  @IsEmpty()
  createdAt: Date;
  @IsEmpty()
  updatedAt: Date;
}
