import { CategoryInterface } from '@category/category/entities/category.interface';
import { ObjectId } from 'mongoose';

export interface GroupInterface {
  _id?: ObjectId;
  id: string;
  name: string;
  slug: string;
  valueGroup: string;
  description: string;
  searchText: string;
  category: CategoryInterface;
  groupParent: GroupInterface;
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
