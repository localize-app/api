// src/phrases/entities/phrase.entity.ts
import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { Project } from '../../projects/entities/project.entity';
import {
  BaseEntity,
  baseSchemaOptions,
} from '../../common/entities/base.entity';
import { Translation, TranslationSchema } from './translation.entity';

// Define a schema for location data
@Schema({ _id: false })
export class PhraseLocation {
  @Prop({ required: true })
  url: string;

  @Prop()
  path?: string;

  @Prop()
  context?: string;

  @Prop()
  element?: string;

  @Prop({ type: Date, default: Date.now })
  timestamp: Date;
}

export const PhraseLocationSchema =
  SchemaFactory.createForClass(PhraseLocation);

// Define a schema for occurrences data
@Schema({ _id: false })
export class PhraseOccurrences {
  @Prop({ default: 1 })
  count: number;

  @Prop({ type: Date, default: Date.now })
  firstSeen: Date;

  @Prop({ type: Date, default: Date.now })
  lastSeen: Date;

  @Prop({ type: [PhraseLocationSchema], default: [] })
  locations: PhraseLocation[];
}

export const PhraseOccurrencesSchema =
  SchemaFactory.createForClass(PhraseOccurrences);

export type PhraseDocument = HydratedDocument<Phrase>;

@Schema(baseSchemaOptions)
export class Phrase extends BaseEntity {
  @Prop({ required: true })
  key: string;

  @Prop({ required: true })
  sourceText: string;

  @Prop()
  context?: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  })
  project: Project;

  // REMOVED: status property - status is now only per translation

  @Prop({ default: false })
  isArchived: boolean;

  // Translations as a Map: locale code -> Translation
  @Prop({ type: Map, of: TranslationSchema, default: new Map() })
  translations: Map<string, Translation>;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: Date })
  lastSeenAt?: Date;

  @Prop()
  sourceUrl?: string;

  @Prop()
  screenshot?: string;

  // Tracking occurrences
  @Prop({ type: PhraseOccurrencesSchema, default: () => ({}) })
  occurrences?: PhraseOccurrences;

  // Source type (like 'react-app', 'angular', etc.)
  @Prop()
  sourceType?: string;

  // Additional metadata for future extensibility
  @Prop({ type: mongoose.Schema.Types.Mixed })
  metadata?: Record<string, any>;

  @Prop({ type: Date, default: Date.now })
  createdAt?: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt?: Date;
}

export const PhraseSchema = SchemaFactory.createForClass(Phrase);

// Helper method to handle translations more easily
PhraseSchema.methods.getTranslation = function (
  localeCode: string,
): Translation | null {
  return this.translations.get(localeCode) || null;
};

// Helper method to add or update a translation
PhraseSchema.methods.setTranslation = function (
  localeCode: string,
  translation: Translation,
): void {
  this.translations.set(localeCode, translation);
};

// Helper method to check if a locale has a translation
PhraseSchema.methods.hasTranslation = function (localeCode: string): boolean {
  return this.translations.has(localeCode);
};

// Helper method to count translations
PhraseSchema.methods.getTranslationCount = function (): number {
  return this.translations.size;
};

// NEW: Helper methods to get overall phrase status based on translations
PhraseSchema.methods.getOverallStatus = function (): {
  hasApproved: boolean;
  hasPending: boolean;
  hasRejected: boolean;
  totalTranslations: number;
  approvedTranslations: number;
} {
  const translations = Array.from(this.translations.values());

  return {
    hasApproved: translations.some((t: any) => t.status === 'approved'),
    hasPending: translations.some((t: any) => t.status === 'pending'),
    hasRejected: translations.some((t: any) => t.status === 'rejected'),
    totalTranslations: translations.length,
    approvedTranslations: translations.filter(
      (t: any) => t.status === 'approved',
    ).length,
  };
};

// Helper to determine if phrase is "ready" (all translations approved)
PhraseSchema.methods.isReady = function (): boolean {
  const translations = Array.from(this.translations.values());
  return (
    translations.length > 0 &&
    translations.every((t: any) => t.status === 'approved')
  );
};

// Helper to determine if phrase needs attention (has pending/rejected)
PhraseSchema.methods.needsAttention = function (): boolean {
  const translations = Array.from(this.translations.values());
  return translations.some(
    (t: any) => t.status === 'pending' || t.status === 'rejected',
  );
};
