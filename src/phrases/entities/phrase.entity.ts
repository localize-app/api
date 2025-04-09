import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Project } from 'src/projects/entities/project.entity';

export type PhraseDocument = HydratedDocument<Phrase>;

export type TranslationStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'needs_review';

export interface Translation {
  text: string;
  status: TranslationStatus;
  isHuman: boolean;
  lastModified: Date;
  modifiedBy: mongoose.Schema.Types.ObjectId;
}

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Phrase {
  _id: string;

  id!: string;

  @Prop({ required: true })
  key: string;

  @Prop({ required: true })
  sourceText: string;

  @Prop()
  context?: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Project' })
  project: Project;

  @Prop({
    enum: ['published', 'pending', 'needs_review', 'rejected', 'archived'],
    default: 'pending',
  })
  status: string;

  @Prop({ default: false })
  isArchived: boolean;

  @Prop({ type: mongoose.Schema.Types.Mixed })
  translations: Record<string, Translation>;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop()
  lastSeenAt?: Date;

  @Prop()
  sourceUrl?: string;

  @Prop()
  screenshot?: string;
}

export const PhraseSchema = SchemaFactory.createForClass(Phrase);
