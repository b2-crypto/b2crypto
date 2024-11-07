import { Category } from '@category/category/entities/mongoose/category.schema';
import { GroupEntity } from '@group/group/entities/group.entity';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Document } from 'mongoose';
import { GroupInterface } from '../group.interface';
import { GroupTypeEnum } from '@group/group/enum/group.type.enum';
import { User } from '@user/user/entities/mongoose/user.schema';

export type GroupDocument = Group & Document;

@Schema({
  timestamps: true,
})
export class Group extends GroupEntity implements GroupInterface {
  id: string;

  @Prop()
  name: string;

  @Prop()
  slug: string;

  @Prop({ default: false })
  hidden: boolean;

  @Prop()
  valueGroup: string;

  @Prop({ type: String, enum: GroupTypeEnum, default: GroupTypeEnum.GROUP })
  type: GroupTypeEnum;

  @Prop({ default: 0 })
  valueGroupNumber: number;

  @Prop()
  description: string;

  @Prop()
  searchText: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'categories' })
  category: Category;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'groups' })
  groupParent: Group;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'users' })
  user: User;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'categories' }] })
  rules: Category[];
}

export const GroupSchema = SchemaFactory.createForClass(Group);
