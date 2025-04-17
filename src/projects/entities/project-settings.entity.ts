// src/projects/entities/project-settings.entity.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProjectSettingsDocument = HydratedDocument<ProjectSettings>;

@Schema({ _id: false }) // Subdocument schema, doesn't need its own _id
export class ProjectSettings {
  @Prop({ type: Boolean, default: true })
  translationQA: boolean;

  @Prop({ type: Boolean, default: true })
  monthlyReport: boolean;

  @Prop({ type: Boolean, default: true })
  autoDetectLanguage: boolean;

  @Prop({ type: Boolean, default: false })
  archiveUnusedPhrases: boolean;

  @Prop({ type: Boolean, default: true })
  translateMetaTags: boolean;

  @Prop({ type: Boolean, default: true })
  translateAriaLabels: boolean;

  @Prop({ type: Boolean, default: true })
  translatePageTitles: boolean;

  @Prop({ type: Boolean, default: false })
  customizeImages: boolean;

  @Prop({ type: Boolean, default: false })
  customizeUrls: boolean;

  @Prop({ type: Boolean, default: false })
  customizeAudio: boolean;

  @Prop({ type: Boolean, default: true })
  dateHandling: boolean;

  @Prop({ type: Boolean, default: false })
  ignoreCurrency: boolean;
}

export const ProjectSettingsSchema =
  SchemaFactory.createForClass(ProjectSettings);
