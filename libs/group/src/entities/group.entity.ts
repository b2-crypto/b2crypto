import { CategoryEntity } from '@category/category/entities/category.entity';
import { GroupInterface } from '@group/group/entities/group.interface';
import { ApiProperty } from '@nestjs/swagger';
import { ObjectId } from 'mongodb';

export class GroupEntity implements GroupInterface {
  _id?: ObjectId;
  id: ObjectId;
  @ApiProperty({
    type: String,
    description: 'Name of the Group',
  })
  name: string;
  slug: string;
  valueGroup: string;
  description: string;
  searchText: string;
  category: CategoryEntity;
  groupParent: GroupEntity;
  rules: CategoryEntity[];
  createdAt: Date;
  updatedAt: Date;
}
