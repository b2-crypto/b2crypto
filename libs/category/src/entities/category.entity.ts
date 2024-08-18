import { CategoryInterface } from '@category/category/entities/category.interface';
import ResourcesEnum from '@common/common/enums/ResourceEnum';
import TagEnum from '@common/common/enums/TagEnum';
import { GroupEntity } from '@group/group/entities/group.entity';
import { ApiProperty } from '@nestjs/swagger';
import { ObjectId } from 'mongoose';

export class CategoryEntity implements CategoryInterface {
  _id?: ObjectId;
  id: ObjectId;
  @ApiProperty({
    type: String,
    description: 'Name',
  })
  name: string;
  slug: string;
  @ApiProperty({
    type: String,
    description: 'Description',
  })
  description: string;
  searchText: string;
  type: TagEnum;
  categoryParent: CategoryEntity;
  groups: GroupEntity[];
  resources: ResourcesEnum[];
  createdAt: Date;
  updatedAt: Date;
  valueNumber: number;
  valueText: string;
}
