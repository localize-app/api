// src/phrases/entities/translation.entity.ts
import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { User } from '../../users/entities/user.entity';

export enum TranslationStatus {
  PENDING = 'pending', // Waiting for review
  APPROVED = 'approved', // Ready for use
  REJECTED = 'rejected', // Needs revision
  NEEDS_REVIEW = 'needs_review', // Flagged for re-review
  DRAFT = 'draft', // Work in progress
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
  isHuman: boolean; // false for machine translations

  @Prop({ type: Date, default: Date.now })
  lastModified: Date;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  modifiedBy?: User;

  @Prop({ type: Date })
  reviewedAt?: Date;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  reviewedBy?: User;

  @Prop({ type: String })
  reviewComments?: string; // Comments from reviewer

  // NEW: Additional useful fields
  @Prop({ type: Date })
  createdAt?: Date;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  createdBy?: User;

  @Prop({ default: 1 })
  version?: number; // Track translation versions

  // Quality score (if using automated quality checks)
  @Prop({ type: Number, min: 0, max: 100 })
  qualityScore?: number;

  // Flag for translations that need special attention
  @Prop({ default: false })
  needsReview?: boolean;
}

export const TranslationSchema = SchemaFactory.createForClass(Translation);
