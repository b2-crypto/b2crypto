import ResourcesEnum from '@common/common/enums/ResourceEnum';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ScopeEntity } from '@permission/permission/entities/scope.entity';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ScopeDocument = Scope & Document;

@Schema({
  timestamps: true,
})
export class Scope extends ScopeEntity {
  id: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId })
  resourceId: MongooseSchema.Types.ObjectId;

  @Prop({ type: String, enum: ResourcesEnum })
  resourceName: ResourcesEnum;
}

export const ScopeSchema = SchemaFactory.createForClass(Scope);
