import { CategoryInterface } from '@category/category/entities/category.interface';
import CurrencyCodeB2cryptoEnum from '@common/common/enums/currency-code-b2crypto.enum';
import { FileInterface } from '@file/file/entities/file.interface';
import { PermissionInterface } from '@permission/permission/entities/permission.interface';
import { PersonInterface } from '@person/person/entities/PersonInterface';
import { RoleInterface } from '@role/role/entities/role.interface';
import { ObjectId } from 'mongoose';
import UserVerifyIdentityDto from '../dto/user.verify.identity.dto';
import { UserBalanceModel } from './user.balance.model';
import { BrandInterface } from '@brand/brand/entities/brand.interface';

export interface UserInterface {
  _id?: ObjectId;
  id: ObjectId;
  email: string;
  slugEmail: string;
  searchText: string;
  name: string;
  slug: string;
  description: string;
  username: string;
  slugUsername: string;
  password: string;
  confirmPassword?: string;
  active: boolean;
  individual: boolean;
  isClientAPI: boolean;
  inMaintenance: boolean;
  maintenanceStartAt: Date;
  maintenanceEndAt: Date;
  balance: UserBalanceModel;
  apiKey: string;
  configuration: JSON;
  twoFactorSecret: string;
  twoFactorQr: string;
  twoFactorIsActive: boolean;
  amountCustodial: number;
  currencyCustodial: CurrencyCodeB2cryptoEnum;
  image: FileInterface;
  brand: BrandInterface;
  role: RoleInterface;
  permissions: Array<PermissionInterface>;
  authorizations: Array<string>;
  category: CategoryInterface;
  level: CategoryInterface;
  personalData: PersonInterface;
  userParent: UserInterface;
  verifyIdentity: boolean;
  verifyIdentityTtl: number;
  verifyIdentityCode: string;
  verifyIdentityStatus: string;
  verifyIdentityLevelName: string;
  verifyIdentityExpiredAt: Date;
  verifyIdentityResponse: UserVerifyIdentityDto;
  createdAt: Date;
  updatedAt: Date;
}

export const UserPropertiesRelations = [
  'image',
  'role',
  'category',
  'personalData',
  'userParent',
];

export const UserPropertiesBasic = [
  '_id',
  'id',
  'email',
  'slugEmail',
  'searchText',
  'name',
  'slug',
  'description',
  'username',
  'slugUsername',
  'password',
  'confirmPassword',
  'active',
  'isClientAPI',
  'apiKey',
  'configuration',
  'twoFactorSecret',
  'twoFactorQr',
  'createdAt',
  'updatedAt',
];
