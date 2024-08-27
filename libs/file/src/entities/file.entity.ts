import { CategoryEntity } from '@category/category/entities/category.entity';
import ResourcesEnum from '@common/common/enums/ResourceEnum';
import { FileInterface } from '@file/file/entities/file.interface';
import { UserEntity } from '@user/user/entities/user.entity';
import { ObjectId } from 'mongodb';

export class FileEntity implements FileInterface {
  id: ObjectId;
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
