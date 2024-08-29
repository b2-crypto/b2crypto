import { Category } from '@category/category/entities/mongoose/category.schema';
import { GroupEntity } from '@group/group/entities/group.entity';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import * as mongoose from 'mongoose';
import { Document, ObjectId } from 'mongoose';
import { GroupInterface } from '../group.interface';

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

  @Prop()
  valueGroup: string;

  @Prop()
  description: string;

  @Prop()
  searchText: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'categories' })
  category: Category;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'groups' })
  groupParent: Group;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'groups' }] })
  rules: Category[];
}

export const GroupSchema = SchemaFactory.createForClass(Group);
