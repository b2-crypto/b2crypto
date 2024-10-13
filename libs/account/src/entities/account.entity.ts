import { AccountInterface } from '@account/account/entities/account.interface';
import { AffiliateEntity } from '@affiliate/affiliate/domain/entities/affiliate.entity';
import { BrandEntity } from '@brand/brand/entities/brand.entity';
import { CategoryEntity } from '@category/category/entities/category.entity';
import CountryCodeB2cryptoEnum from '@common/common/enums/country.code.b2crypto.enum';
import { CrmEntity } from '@crm/crm/entities/crm.entity';
import { GroupEntity } from '@group/group/entities/group.entity';
import { ApiProperty } from '@nestjs/swagger';
import { PersonEntity } from '@person/person/entities/person.entity';
import { StatusEntity } from '@status/status/entities/status.entity';
import { TransferEntity } from '@transfer/transfer/entities/transfer.entity';
import { UserEntity } from '@user/user/entities/user.entity';
import { ObjectId } from 'mongodb';
import StatusAccountEnum from '../enum/status.account.enum';
import TypesAccountEnum from '../enum/types.account.enum';
import CurrencyCodeB2cryptoEnum from '@common/common/enums/currency-code-b2crypto.enum';

export class AccountEntity implements AccountInterface {
  _id?: ObjectId;
  @ApiProperty({
    type: Date,
    description: 'Created date',
  })
  createdAt: Date;
  @ApiProperty({
    type: Date,
    description: 'Updated date',
  })
  updatedAt: Date;
  @ApiProperty({
    type: String,
    description: 'Created date',
  })
  id: ObjectId;
  @ApiProperty({
    type: String,
    description: 'Name of the account',
  })
  name: string;
  @ApiProperty({
    type: String,
    description: 'FirstName of the account',
  })
  firstName?: string;
  @ApiProperty({
    type: String,
    description: 'LastName of the account',
  })
  lastName?: string;
  @ApiProperty({
    description: 'Types of the account',
    enum: CountryCodeB2cryptoEnum,
    enumName: 'TypesAccountList',
  })
  type?: TypesAccountEnum;
  accountType?: string;
  slug: string;
  @ApiProperty({
    type: String,
    description: 'Description of the account',
  })
  description: string;
  searchText: string;
  @ApiProperty({
    type: String,
    description: 'DNI of the account',
  })
  docId: string;
  @ApiProperty({
    type: String,
    description: 'Email of the account',
  })
  email: string;
  @ApiProperty({
    type: String,
    description: 'Telephone number of the account',
  })
  telephone: string;
  @ApiProperty({
    type: String,
    description: 'AccountId of the account in integration',
  })
  accountId: string;
  @ApiProperty({
    type: String,
    description: 'Accountname of the account in integration',
  })
  accountName: string;
  @ApiProperty({
    type: String,
    description: 'Protocol of the account in integration',
  })
  protocol: string;
  @ApiProperty({
    type: String,
    description: 'Native accountname of the account in integration',
  })
  nativeAccountName: string;
  @ApiProperty({
    type: String,
    description: 'number of decimals of the account in integration',
  })
  decimals: number;
  @ApiProperty({
    type: String,
    description: 'Account password of the account in integration',
  })
  accountPassword: string;
  @ApiProperty({
    type: CategoryEntity,
    description: 'Department of the Crm',
  })
  accountDepartment: CategoryEntity;
  @ApiProperty({
    type: String,
    description: 'Url source of the account is coming',
  })
  referral: string;
  owner: UserEntity;
  totalTransfer: number;
  quantityTransfer: number;
  showToOwner: boolean;
  statusText: StatusAccountEnum;
  hasSendDisclaimer: boolean;
  @ApiProperty({
    type: CategoryEntity,
    description: 'Type of source of the account',
  })
  referralType: CategoryEntity | string;
  @ApiProperty({
    type: GroupEntity,
    description: 'Group of the account',
  })
  group: GroupEntity;
  @ApiProperty({
    type: StatusEntity,
    description: 'Status of the account in B2Crypto',
  })
  status: StatusEntity;
  @ApiProperty({
    type: Array<string>,
    description: 'Statuses of the account in the CRM',
  })
  accountStatus: StatusEntity[];
  @ApiProperty({
    description: 'Date Contacted',
    type: Date,
  })
  personalData: PersonEntity;
  @ApiProperty({
    description: 'Country of the account',
    enum: CountryCodeB2cryptoEnum,
    enumName: 'CountryList',
  })
  country: CountryCodeB2cryptoEnum;
  transfers: TransferEntity[];
  @ApiProperty({
    type: CrmEntity,
    description: 'CRM of the account',
  })
  crm: CrmEntity;
  @ApiProperty({
    type: BrandEntity,
    description: 'Brand of the account',
  })
  brand: BrandEntity;
  @ApiProperty({
    type: AffiliateEntity,
    description: 'Affiliate which register account',
  })
  affiliate: AffiliateEntity;

  @ApiProperty({
    type: String,
    description: 'Response account integration',
  })
  responseCreation?: any;

  @ApiProperty({
    type: String,
    description: 'Response shipping integration',
  })
  responseShipping?: any;
  @ApiProperty({
    type: AccountEntity,
    description: 'Account previous',
  })
  prevAccount: AccountEntity;
  @ApiProperty({
    type: Number,
    description: 'Amount available in user currency',
  })
  amount: number;
  @ApiProperty({
    type: String,
    enum: CurrencyCodeB2cryptoEnum,
    enumName: 'CurrencyList',
    description: 'Currency user',
  })
  currency: CurrencyCodeB2cryptoEnum;
  @ApiProperty({
    type: Number,
    description: 'Amount available in user currency',
  })
  amountCustodial: number;
  @ApiProperty({
    type: String,
    enum: CurrencyCodeB2cryptoEnum,
    enumName: 'CurrencyList',
    description: 'Currency user',
  })
  currencyCustodial: CurrencyCodeB2cryptoEnum;
  @ApiProperty({
    type: AccountEntity,
    description: 'Amount blocked in user currency',
  })
  amountBlocked: number;
  @ApiProperty({
    type: String,
    enum: CurrencyCodeB2cryptoEnum,
    enumName: 'CurrencyList',
    description: 'Currency of user amount blocked',
  })
  currencyBlocked: CurrencyCodeB2cryptoEnum;
  @ApiProperty({
    type: AccountEntity,
    description: 'Amount blocked in custodial currency',
  })
  amountBlockedCustodial: number;
  @ApiProperty({
    type: String,
    enum: CurrencyCodeB2cryptoEnum,
    enumName: 'CurrencyList',
    description: 'Currency of custodial amount blocked',
  })
  currencyBlockedCustodial: CurrencyCodeB2cryptoEnum;
}
