// src/common/entities/base.entity.ts
import { Prop } from '@nestjs/mongoose';
import { Schema as MongooseSchema } from 'mongoose';

export abstract class BaseEntity {
  @Prop({ type: MongooseSchema.Types.ObjectId, auto: true })
  _id: MongooseSchema.Types.ObjectId;

  // Virtual property (not stored in DB)
  id?: string;
}

// Utility to configure schema options consistently
export const baseSchemaOptions = {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (_doc: any, ret: any) => {
      ret.id = ret._id?.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
  toObject: {
    virtuals: true,
    transform: (_doc: any, ret: any) => {
      ret.id = ret._id?.toString();
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
};
