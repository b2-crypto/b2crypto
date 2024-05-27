import { AffiliateInterface } from '@affiliate/affiliate/domain/entities/affiliate.interface';
import { CategoryInterface } from '@category/category/entities/category.interface';
import CountryCodeB2cryptoEnum from '@common/common/enums/country.code.b2crypto.enum';
import { CrmInterface } from '@crm/crm/entities/crm.interface';
import { GroupInterface } from '@group/group/entities/group.interface';
import { PersonInterface } from '@person/person/entities/PersonInterface';
import { StatusInterface } from '@status/status/entities/status.interface';
import { UserInterface } from '@user/user/entities/user.interface';
import { BrandInterface } from 'libs/brand/src/entities/brand.interface';
import { ObjectId } from 'mongodb';

export interface AccountInterface {
  _id?: ObjectId;
  id?: ObjectId;
  name: string;
  slug: string;
  description: string;
  searchText: string;
  docId: string;
  email: string;
  telephone: string;
  accountType?: string;
  accountId?: string;
  accountName?: string;
  accountPassword?: string;
  accountDepartment?: CategoryInterface;
  accountStatus?: StatusInterface[];
  referral: string;
  integration?: UserInterface;
  totalTransfer: number;
  quantityTransfer: number;
  showToAffiliate: boolean;
  hasSendDisclaimer: boolean;
  referralType?: CategoryInterface | string;
  group?: GroupInterface;
  status?: StatusInterface;
  personalData: PersonInterface;
  country: CountryCodeB2cryptoEnum;
  crm?: CrmInterface;
  brand?: BrandInterface;
  affiliate?: AffiliateInterface;
  createdAt: Date;
  updatedAt: Date;
  firstName?: string;
  lastName?: string;
  type?: string;
  responseCreation?: string;
  prevAccount?: AccountInterface;
  amount?: number;
  amountBlocked?: number;
}

export const AccountPropertiesRelations = [
  'crmDepartment',
  'integration',
  'referralType',
  'group',
  'status',
  'statusCrm',
  'personalData',
  'transfers',
  'crm',
  'brand',
  'affiliate',
];

export const AccountPropertiesBasic = [
  '_id',
  'id',
  'name',
  'slug',
  'description',
  'searchText',
  'docId',
  'email',
  'telephone',
  'crmIdLead',
  'crmAccountIdLead',
  'crmAccountPasswordLead',
  'crmTradingPlatformAccountId',
  'referral',
  'totalPayed',
  'totalTransfer',
  'quantityTransfer',
  'showToAffiliate',
  'hasSendDisclaimer',
  'hasMoved',
  'hasAddedCftd',
  'hasAddedFtd',
  'country',
  'createdAt',
  'updatedAt',
  'dateContacted',
  'dateCFTD',
  'dateFTD',
  'dateRetention',
  '//',
  'ai',
  'ci',
  'gi',
  'userIp',
  'firstname',
  'lastname',
  'password',
  'phone',
  'so',
  'sub',
  'MPC_1',
  'MPC_2',
  'MPC_3',
  'MPC_4',
  'MPC_5',
  'MPC_6',
  'MPC_7',
  'MPC_8',
  'MPC_9',
  'MPC_10',
  'MPC_11',
  'MPC_12',
  'ad',
  'keywords',
  'campaign',
  'campaignId',
  'medium',
  'comments',
  'sourceId',
  'responseCrm',
];
