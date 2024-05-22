import { AffiliateInterface } from '@affiliate/affiliate/domain/entities/affiliate.interface';
import { BrandInterface } from 'libs/brand/src/entities/brand.interface';
import { CategoryInterface } from '@category/category/entities/category.interface';
import { CrmInterface } from '@crm/crm/entities/crm.interface';
import { GroupInterface } from '@group/group/entities/group.interface';
import { LeadPspEntity } from '@lead/lead/entities/lead-psp.entity';
import { StatusInterface } from '@status/status/entities/status.interface';
import { ObjectId } from 'mongoose';

export interface PspInterface {
  _id?: ObjectId;
  id: string;
  name: string;
  slug: string;
  description: string;
  idCashier: string;
  searchText: string;
  quantityPayments: number;
  quantityApprovedPayments: number;
  quantityRejectedPayments: number;
  totalPayments: number;
  totalWithdrawal: number;
  totalApprovedPayments: number;
  totalRejectedPayments: number;
  approvedPercent: number;
  rejectedPercent: number;
  minDeposit: number;
  maxDeposit: number;
  hasChecked: boolean;

  quantityLeads: number;
  totalLeads: number;
  quantityFtd: number;
  totalFtd: number;
  quantityCftd: number;
  totalCftd: number;
  totalConversion: number;
  quantityAffiliateFtd: number;
  totalAffiliateFtd: number;
  totalAffiliateConversion: number;

  status: StatusInterface;
  crms: CrmInterface[];
  groups: GroupInterface[];
  leadsUsing: LeadPspEntity[];
  category: CategoryInterface;
  brand: BrandInterface;
  blackListCountries: CategoryInterface[];
  blackListAffiliates: AffiliateInterface[];
  whiteListBrands: BrandInterface[];
  whiteListCountries: CategoryInterface[];
  whiteListAffiliates: AffiliateInterface[];
  blackListBrands: BrandInterface[];
  createdAt: Date;
  updatedAt: Date;
}
