import { BrandInterface } from 'libs/brand/src/entities/brand.interface';
import { CategoryEntity } from '@category/category/entities/category.entity';
import { CategoryInterface } from '@category/category/entities/category.interface';
import CountryCodeEnum from '@common/common/enums/country.code.b2crypto.enum';
import CurrencyCodeB2cryptoEnum from '@common/common/enums/currency-code-b2crypto.enum';
import { CrmInterface } from '@crm/crm/entities/crm.interface';
import { LeadEntity } from '@lead/lead/entities/lead.entity';
import { PspAccountInterface } from '@psp-account/psp-account/entities/psp-account.interface';
import { PspInterface } from '@psp/psp/entities/psp.interface';
import { StatusEntity } from '@status/status/entities/status.entity';
import { ObjectId } from 'mongoose';
import { OperationTransactionType } from '../enum/operation.transaction.type.enum';
import { AffiliateInterface } from '@affiliate/affiliate/domain/entities/affiliate.interface';
import { PspResponse } from '../dto/transfer.latamcashier.response.dto';
import { UserInterface } from '@user/user/entities/user.interface';
import { AccountEntity } from '@account/account/entities/account.entity';
import TypesAccountEnum from '@account/account/enum/types.account.enum';

export interface TransferInterface {
  _id: string;
  id: ObjectId;
  numericId: number;
  name: string;
  slug: string;
  description: string;
  searchText: string;
  operationType: OperationTransactionType;
  country: CountryCodeEnum;
  // Amount in minimal units
  amount: number;
  currency: CurrencyCodeB2cryptoEnum;
  amountCustodial: number;
  currencyCustodial: CurrencyCodeB2cryptoEnum;
  leadEmail: string;
  leadTpId: string;
  leadAccountId: string;
  leadCrmName: string;
  leadCountry: CountryCodeEnum;
  leadName: string;
  leadTradingPlatformId: string;
  crmTransactionId: string;
  crmTransactionResponse: any;
  idPayment: string;
  statusPayment: string;
  descriptionStatusPayment: string;
  urlPayment: string;
  responsePayment: PspResponse;
  responseAccount: any;
  lead: LeadEntity;
  account: AccountEntity;
  accountResultBalance: number;
  accountPrevBalance: number;
  typeAccount: TypesAccountEnum;
  typeAccountType: string;
  affiliate: AffiliateInterface;
  status: StatusEntity;
  bank: CategoryEntity;
  department: CategoryInterface;
  typeTransaction: CategoryInterface;
  pspAccount: PspAccountInterface;
  psp: PspInterface;
  crm: CrmInterface;
  userAccount: UserInterface;
  userCreator: UserInterface;
  userApprover: UserInterface;
  userRejecter: UserInterface;
  page: string;
  brand: BrandInterface;
  confirmedAt: Date;
  hasChecked: boolean;
  isApprove: boolean;
  checkedOnCashier: boolean;
  approvedAt: Date;
  rejectedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
export const TransferPropertiesRelations = [
  'lead',
  'affiliate',
  'status',
  'bank',
  'department',
  'typeTransaction',
  'pspAccount',
  'psp',
  'crm',
  'brand',
];

export const TransferPropertiesBasic = [
  '_id',
  'numericId',
  'name',
  'slug',
  'description',
  'searchText',
  'currency',
  'operationType',
  'country',
  'amount',
  'leadEmail',
  'leadTpId',
  'leadAccountId',
  'leadCrmName',
  'leadCountry',
  'leadName',
  'leadTradingPlatformId',
  'crmTransactionId',
  'idPayment',
  'statusPayment',
  'descriptionStatusPayment',
  'urlPayment',
  'lead',
  'page',
  'confirmedAt',
  'hasChecked',
  'isApprove',
  'checkedOnCashier',
  'approvedAt',
  'rejectedAt',
  'createdAt',
  'updatedAt',
];
