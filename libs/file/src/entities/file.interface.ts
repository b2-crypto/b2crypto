import { CategoryEntity } from '@category/category/entities/category.entity';
import ResourcesEnum from '@common/common/enums/ResourceEnum';
import { UserEntity } from '@user/user/entities/user.entity';

export interface FileInterface {
  id: string;
  name: string;
  slug: string;
  description: string;
  searchText: string;
  uri: string;
  path: string;
  encodeBase64: string;
  mimetype: string;
  category: CategoryEntity;
  user: UserEntity;
  createdAt: Date;
  updatedAt: Date;
  resourceId: string;
  resourceType: ResourcesEnum;
}

export const FilePropertiesRelations = ['category', 'user'];

export const FilePropertiesBasic = [
  '_id',
  'id',
  'name',
  'slug',
  'description',
  'searchText',
  'uri',
  'path',
  'mimetype',
  'createdAt',
  'updatedAt',
];
