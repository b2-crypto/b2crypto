import { CategoryInterface } from '@category/category/entities/category.interface';
import { ObjectId } from 'mongoose';
import { GroupTypeEnum } from '../enum/group.type.enum';
import { UserEntity } from '@user/user/entities/user.entity';

export interface GroupInterface {
  _id?: ObjectId;
  id: string;
  name: string;
  slug: string;
  hidden: boolean;
  valueGroup: string;
  description: string;
  type: GroupTypeEnum;
  valueGroupNumber: number;
  searchText: string;
  category: CategoryInterface;
  groupParent: GroupInterface;
  user: UserEntity;
  rules: CategoryInterface[];
  createdAt: Date;
  updatedAt: Date;
}

export const GroupPropertiesRelations = [
  'pspGroup',
  'status',
  'crmOptions',
  'leads',
  'category',
  'affiliates',
];

export const GroupPropertiesBasic = [
  '_id',
  'id',
  'name',
  'slug',
  'description',
  'searchText',
  'createdAt',
  'updatedAt',
];
