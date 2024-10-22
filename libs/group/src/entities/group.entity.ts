import { CategoryEntity } from '@category/category/entities/category.entity';
import { GroupInterface } from '@group/group/entities/group.interface';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '@user/user/entities/mongoose/user.schema';
import { ObjectId } from 'mongodb';
import { GroupTypeEnum } from '../enum/group.type.enum';

export class GroupEntity implements GroupInterface {
  _id?: ObjectId;
  id: ObjectId;
  @ApiProperty({
    type: String,
    description: 'Name of the Group',
  })
  name: string;
  slug: string;
  hidden: boolean;
  valueGroup: string;
  description: string;
  type: GroupTypeEnum;
  valueGroupNumber: number;
  searchText: string;
  category: CategoryEntity;
  groupParent: GroupEntity;
  user: User;
  rules: CategoryEntity[];
  createdAt: Date;
  updatedAt: Date;
}
