import { BrandEntity } from 'libs/brand/src/entities/brand.entity';
import { CategoryEntity } from '@category/category/entities/category.entity';
import CountryCodeEnum from '@common/common/enums/country.code.b2crypto.enum';
import CurrencyCodeB2cryptoEnum from '@common/common/enums/currency-code-b2crypto.enum';
import { PspAccountEntity } from '@psp-account/psp-account/entities/psp-account.entity';
import { PspEntity } from '@psp/psp/entities/psp.entity';
import { StatusEntity } from '@status/status/entities/status.entity';
import { TransferEntity } from '@transfer/transfer/entities/transfer.entity';
import { ObjectId } from 'mongoose';
import { LeadEntity } from './lead.entity';

export interface LeadPspInterface {
  id: ObjectId;
  name: string;
  slug: string;
  description: string;
  searchText: string;
  currency: CurrencyCodeB2cryptoEnum;
  // Amount in minimal units
  amount: number;
  leadEmail: string;
  leadTpId: string;
  leadCrmName: string;
  leadCountry: CountryCodeEnum;
  idPayment: string;
  lead: LeadEntity;
  status: StatusEntity;
  bank: CategoryEntity;
  department: CategoryEntity;
  typeTransfer: CategoryEntity;
  pspAccount: PspAccountEntity;
  psp: PspEntity;
  transfer: TransferEntity;
  page: string;
  brand: BrandEntity;
  confirmedAt: Date;
  approved: boolean;
}
