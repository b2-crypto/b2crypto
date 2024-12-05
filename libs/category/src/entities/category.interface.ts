import ResourcesEnum from '@common/common/enums/ResourceEnum';
import TagEnum from '@common/common/enums/TagEnum';
import { ObjectId } from 'mongoose';

export interface CategoryInterface {
  _id?: ObjectId;
  id?: ObjectId;
  name: string;
  slug: string;
  hidden: boolean;
  description: string;
  searchText: string;
  next: CategoryInterface;
  previous: CategoryInterface;
  type: TagEnum;
  categoryParent: CategoryInterface;
  resources: ResourcesEnum[];
  createdAt: Date;
  updatedAt: Date;
  valueNumber: number;
  valueText: string;
}

export const CategoryPropertiesRelations = ['category'];

export const CategoryPropertiesBasic = [
  'id',
  'name',
  'slug',
  'description',
  'searchText',
  'type',
  'resources',
  'createdAt',
  'updatedAt',
  'valueNumber',
  'valueText',
];
