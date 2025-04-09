import * as mongoose from 'mongoose';
import { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { User } from 'src/users/entities/user.entity';
import { Company } from 'src/companies/entities/company.entity';

export type ProjectDocument = HydratedDocument<Project>;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Project {
  _id: string;

  id!: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  })
  company: Company;

  @Prop({
    enum: ['website', 'webapp', 'mobile_app', 'desktop_app', 'other'],
    default: 'website',
  })
  projectType: string;

  @Prop()
  websiteUrl?: string;

  @Prop()
  projectKey?: string; // For API access

  @Prop({ type: [String], default: [] })
  supportedLocales: string[]; // Array of locale codes this project supports

  @Prop({ default: false })
  isArchived: boolean;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] })
  members: User[]; // Team members with access to this project

  @Prop({ default: {} })
  settings: {
    translationQA: boolean;
    monthlyReport: boolean;
    autoDetectLanguage: boolean;
    archiveUnusedPhrases: boolean;
    translateMetaTags: boolean;
    translateAriaLabels: boolean;
    translatePageTitles: boolean;
    customizeImages: boolean;
    customizeUrls: boolean;
    customizeAudio: boolean;
    dateHandling: boolean;
    ignoreCurrency: boolean;
  };
}

export const ProjectSchema = SchemaFactory.createForClass(Project);

// Add virtual to get phrase count
ProjectSchema.virtual('phraseCount', {
  ref: 'Phrase',
  localField: '_id',
  foreignField: 'project',
  count: true,
});

// Add virtual to get pending phrases count
ProjectSchema.virtual('pendingPhraseCount', {
  ref: 'Phrase',
  localField: '_id',
  foreignField: 'project',
  count: true,
  match: { status: 'pending' },
});

// Add virtual to get published phrases count
ProjectSchema.virtual('publishedPhraseCount', {
  ref: 'Phrase',
  localField: '_id',
  foreignField: 'project',
  count: true,
  match: { status: 'published' },
});
