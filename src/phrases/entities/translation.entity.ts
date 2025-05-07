import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { User } from '../../users/entities/user.entity';

export enum TranslationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  NEEDS_REVIEW = 'needs_review',
}

@Schema({ _id: false }) // Subdocument schema
export class Translation {
  @Prop({ required: true })
  text: string;

  @Prop({
    enum: Object.values(TranslationStatus),
    default: TranslationStatus.PENDING,
    type: String,
  })
  status: TranslationStatus;

  @Prop({ default: true })
  isHuman: boolean;

  @Prop({ type: Date, default: Date.now })
  lastModified: Date;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  modifiedBy?: User;

  // @Prop({ type: Boolean, default: false })
  // isReviewed: boolean;

  @Prop({ type: Date })
  reviewedAt?: Date;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  reviewedBy?: User;

  @Prop({ type: String })
  comments?: string;
}

export const TranslationSchema = SchemaFactory.createForClass(Translation);
