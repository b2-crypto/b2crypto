import { CategoryEntity } from '@category/category/entities/category.entity';
import ResourcesEnum from '@common/common/enums/ResourceEnum';
import TagEnum from '@common/common/enums/TagEnum';
import { Group } from '@group/group/entities/mongoose/group.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, ObjectId } from 'mongoose';
import { CategoryInterface } from '../category.interface';

export type CategoryDocument = Category & Document;

@Schema({
  timestamps: true,
})
export class Category extends CategoryEntity implements CategoryInterface {
  id: ObjectId;

  @Prop()
  name: string; // alias

  @Prop()
  slug: string;

  @Prop()
  description: string; // name

  @Prop()
  searchText: string;

  @Prop()
  valueNumber: number; // iso

  @Prop()
  valueText: string; // alpha

  @Prop({ type: String, enum: TagEnum })
  type: TagEnum;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'categories' })
  categoryParent: Category;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'groups' })
  groups: Group[];

  @Prop({ type: [String], enum: ResourcesEnum })
  resources: ResourcesEnum[];

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
