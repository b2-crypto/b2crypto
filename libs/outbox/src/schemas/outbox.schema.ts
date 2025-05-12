import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type OutboxDocument = Outbox & Document;

@Schema({
  timestamps: true,
})
export class Outbox {
  _id: mongoose.Types.ObjectId;

  @Prop({ index: true })
  topic: string;

  @Prop({ index: true })
  correlationId: string;

  @Prop()
  jsonPayload: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;

  @Prop({ index: true })
  publishAfter: Date;

  @Prop({ default: false })
  isInOutbox: boolean;

  @Prop({ default: false })
  isPublished: boolean;
}

export const OutboxSchema = SchemaFactory.createForClass(Outbox);
