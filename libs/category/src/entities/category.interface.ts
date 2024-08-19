import ResourcesEnum from '@common/common/enums/ResourceEnum';
import TagEnum from '@common/common/enums/TagEnum';
import { GroupInterface } from '@group/group/entities/group.interface';
import { ObjectId } from 'mongoose';

export interface CategoryInterface {
  _id?: ObjectId;
  id?: ObjectId;
  name: string;
  slug: string;
  description: string;
  searchText: string;
  type: TagEnum;
  categoryParent: CategoryInterface;
  groups: GroupInterface[];
  resources: ResourcesEnum[];
  createdAt: Date;
  updatedAt: Date;
  valueNumber: number;
  valueText: string;
}

export const CategoryPropertiesRelations = ['category', 'group'];

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
