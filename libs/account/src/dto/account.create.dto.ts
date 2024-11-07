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
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { ObjectId } from 'mongodb';
import { AccountInterface } from '../entities/account.interface';
import TypesAccountEnum from '../enum/types.account.enum';
import StatusAccountEnum from '../enum/status.account.enum';
import CurrencyCodeB2cryptoEnum from '@common/common/enums/currency-code-b2crypto.enum';

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
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({
    required: false,
    type: String,
    description: 'Param lastName',
  })
  @IsOptional()
  @IsString()
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

  @IsString()
  @Min(0)
  @ApiProperty({
    required: false,
    description: 'Account pin',
  })
  pin: string;

  @ApiProperty({
    required: false,
    description: 'Account DocId',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @ApiProperty({
    required: false,
    description: 'Account email',
  })
  @IsOptional()
  email: string;

  @ApiProperty({
    required: false,
    description: 'Account telephone',
  })
  @IsOptional()
  telephone: string;

  @ApiProperty({
    required: false,
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
    description: 'ID Account',
  })
  @IsString()
  @IsOptional()
  protocol?: string;

  @ApiProperty({
    required: false,
    description: 'ID Account',
  })
  @IsString()
  @IsOptional()
  nativeAccountName?: string;

  @ApiProperty({
    required: false,
    description: 'ID Account',
  })
  @IsString()
  @IsOptional()
  decimals: number;

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
  referral?: string;

  @ApiProperty({
    required: false,
    enum: CountryCodeEnum,
    enumName: 'CountryCode',
    description: 'Country code',
  })
  @IsEnum(CountryCodeEnum)
  @IsOptional()
  country?: CountryCodeEnum;

  @ApiProperty({
    required: false,
    example: 'GOOGLE',
    description: 'Account referral type',
  })
  @IsString()
  @IsOptional()
  referralType?: string;

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
  personalData?: ObjectId;

  @IsOptional()
  @IsMongoId()
  owner?: ObjectId;

  @IsMongoId({ each: true })
  @IsOptional()
  pspsUsed?: ObjectId[];

  @IsOptional()
  @IsMongoId()
  crm?: ObjectId;

  @IsOptional()
  @IsMongoId()
  brand?: ObjectId;

  @IsOptional()
  @IsMongoId()
  affiliate?: ObjectId;

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
  @IsOptional()
  @IsBoolean()
  showToOwner = true;
  @IsEmpty()
  statusText: StatusAccountEnum;
  @IsEmpty()
  accountStatus: StatusInterface[];
  @IsEmpty()
  createdAt: Date;
  @IsEmpty()
  updatedAt: Date;
  @IsEmpty()
  cardConfig: any;
  @IsOptional()
  prevAccount?: AccountInterface;
  @IsEmpty()
  amount: number;
  @IsEmpty()
  currency: CurrencyCodeB2cryptoEnum;
  @IsEmpty()
  amountCustodial: number;
  @IsEmpty()
  currencyCustodial: CurrencyCodeB2cryptoEnum;
  @IsEmpty()
  amountBlocked: number;
  @IsEmpty()
  currencyBlocked: CurrencyCodeB2cryptoEnum;
  @IsEmpty()
  amountBlockedCustodial: number;
  @IsEmpty()
  currencyBlockedCustodial: CurrencyCodeB2cryptoEnum;
  @IsEmpty()
  afgId: string;
}
