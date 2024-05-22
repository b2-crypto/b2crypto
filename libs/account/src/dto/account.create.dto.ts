import CountryCodeB2cryptoEnum from '@common/common/enums/country.code.b2crypto.enum';
import { CreateAnyDto } from '@common/common/models/create-any.dto';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEmpty,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ObjectId } from 'mongodb';
import { AccountInterface } from '../entities/account.interface';
import { CategoryUpdateDto } from '@category/category/dto/category.update.dto';
import { PersonCreateDto } from '@person/person/dto/person.create.dto';
import { StatusInterface } from '@status/status/entities/status.interface';

export class AccountCreateDto extends CreateAnyDto implements AccountInterface {
  _id?: ObjectId;
  id: ObjectId;
  slug: string;
  @ApiProperty({
    description: 'account name',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    type: String,
    description: 'Param firstName',
  })
  firstName?: string;

  @ApiProperty({
    type: String,
    description: 'Param lastName',
  })
  lastName?: string;

  @IsEmpty()
  searchText: string;

  @ApiProperty({
    description: 'Account DocId',
  })
  @IsOptional()
  docId: string;

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
    description: 'ID Account',
  })
  @IsString()
  @IsOptional()
  accountId?: string;

  @ApiProperty({
    description: 'AccountName',
  })
  @IsString()
  @IsOptional()
  accountName?: string;

  @IsBoolean()
  @IsOptional()
  hasSendDisclaimer = false;

  @ApiProperty({
    description: 'Account password',
  })
  @IsString()
  @IsOptional()
  accountPassword?: string;

  @IsEmpty()
  accountDepartment?: ObjectId;

  @ApiProperty({
    description: 'Account referral',
  })
  @IsString()
  @IsOptional()
  referral: string;

  //@IsEmpty()
  @IsOptional()
  integration?: ObjectId;

  @ApiProperty({
    description: 'Account country',
  })
  @IsEnum(CountryCodeB2cryptoEnum)
  @IsOptional()
  country: CountryCodeB2cryptoEnum;

  @ApiProperty({
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
    type: String,
    description: 'Param userIp',
  })
  @IsString()
  @IsOptional()
  userIp?: string;

  @ApiProperty({
    type: String,
    description: 'Param funnelName',
  })
  @IsString()
  @IsOptional()
  sourceId?: string;

  @IsEmpty()
  responseCreation?: string;
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
