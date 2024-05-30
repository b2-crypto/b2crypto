import { BrandEntity } from 'libs/brand/src/entities/brand.entity';
import { CrmEntity } from '@crm/crm/entities/crm.entity';
import { GroupEntity } from '@group/group/entities/group.entity';
import { IpAddressEntity } from '@ip-address/ip-address/entities/ip-address.entity';
import { LeadEntity } from '@lead/lead/entities/lead.entity';
import { PersonEntity } from '@person/person/entities/person.entity';
import { TrafficEntity } from '@traffic/traffic/entities/traffic.entity';
import { UserEntity } from '@user/user/entities/user.entity';
import { UserInterface } from '@user/user/entities/user.interface';
import { ObjectId } from 'mongoose';
import { AccountInterface } from '@account/account/entities/account.interface';

export interface AffiliateInterface {
  _id?: ObjectId;
  id: string;
  name: string;
  slug: string;
  docId: string;
  email: string;
  slugEmail: string;
  telephone: string;
  description: string;
  searchText: string;
  conversionCost: number;
  publicKey: string;
  tradingPlatformId: string;
  organization: string;
  buOwnerId: string;
  crmIdAffiliate: string;
  crmApiKeyAffiliate: string;
  crmTokenAffiliate: string;
  crmDateToExpireTokenAffiliate: Date;
  crmUsernameAffiliate: string;
  crmPasswordAffiliate: string;
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
  isAdmin: boolean;
  user: UserEntity;
  leads: LeadEntity[];
  group: GroupEntity;
  account: AccountInterface;
  affiliateGroup: GroupEntity;
  integrationGroup: GroupEntity;
  traffic: TrafficEntity;
  traffics: TrafficEntity[];
  personalData: PersonEntity;
  ipAllowed: IpAddressEntity[];
  brand: BrandEntity;
  crm: CrmEntity;
  creator: UserInterface;
  createdAt: Date;
  updatedAt: Date;
}

export const AffiliatePropertiesRelations = [
  'user',
  'leads',
  'group',
  'traffic',
  'traffics',
  'personalData',
  'ipAllowed',
  'brand',
  'crm',
  'creator',
];

export const AffiliatePropertiesBasic = [
  '_id',
  'id',
  'name',
  'slug',
  'docId',
  'email',
  'slugEmail',
  'telephone',
  'description',
  'searchText',
  'conversionCost',
  'publicKey',
  'tradingPlatformId',
  'organization',
  'buOwnerId',
  'crmIdAffiliate',
  'crmApiKeyAffiliate',
  'crmTokenAffiliate',
  'crmDateToExpireTokenAffiliate',
  'crmUsernameAffiliate',
  'crmPasswordAffiliate',
  'quantityLeads',
  'totalLeads',
  'quantityFtd',
  'totalFtd',
  'quantityCftd',
  'totalCftd',
  'totalConversion',
  'quantityAffiliateFtd',
  'totalAffiliateFtd',
  'totalAffiliateConversion',
  'isAdmin',
  'createdAt',
  'updatedAt',
];
