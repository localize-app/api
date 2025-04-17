import * as mongoose from 'mongoose';
import { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { User } from 'src/users/entities/user.entity';
import { Company } from 'src/companies/entities/company.entity';
import { BaseEntity, baseSchemaOptions } from 'src/common/entities/base.entity';
import {
  ProjectSettings,
  ProjectSettingsSchema,
} from './project-settings.entity';

export type ProjectDocument = HydratedDocument<Project>;

export enum ProjectType {
  WEBSITE = 'website',
  WEBAPP = 'webapp',
  MOBILE_APP = 'mobile_app',
  DESKTOP_APP = 'desktop_app',
  OTHER = 'other',
}

@Schema(baseSchemaOptions)
export class Project extends BaseEntity {
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
    enum: Object.values(ProjectType),
    default: ProjectType.WEBSITE,
    type: String,
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

  @Prop({ type: ProjectSettingsSchema, default: () => ({}) })
  settings: ProjectSettings;
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
