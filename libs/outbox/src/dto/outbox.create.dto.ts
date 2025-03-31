import mongoose from 'mongoose';

export class OutboxCreateDto {
  _id: mongoose.Types.ObjectId;

  topic: string;

  correlationId: string;

  jsonPayload: string;

  createdAt: Date;

  updatedAt: Date;

  publishAfter: Date;
}
