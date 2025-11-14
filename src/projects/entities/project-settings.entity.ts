// src/projects/entities/project-settings.entity.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProjectSettingsDocument = HydratedDocument<ProjectSettings>;

export enum DateFormatOption {
  ISO = 'YYYY-MM-DD', // 2025-11-14
  US = 'MM/DD/YYYY', // 11/14/2025
  EU = 'DD/MM/YYYY', // 14/11/2025
  LONG = 'MMMM DD, YYYY', // November 14, 2025
  SHORT = 'MMM DD, YYYY', // Nov 14, 2025
}

export enum TimeFormatOption {
  TWELVE_HOUR = '12h',
  TWENTY_FOUR_HOUR = '24h',
}

export enum CurrencySymbolPosition {
  BEFORE = 'before', // $100
  AFTER = 'after', // 100$
}

export enum DecimalSeparator {
  DOT = '.',
  COMMA = ',',
}

export enum ThousandsSeparator {
  COMMA = ',',
  DOT = '.',
  SPACE = ' ',
  NONE = '',
}

@Schema({ _id: false })
export class DateOptions {
  @Prop({ type: String, enum: DateFormatOption })
  format?: DateFormatOption;

  @Prop({ type: String, enum: TimeFormatOption, default: TimeFormatOption.TWELVE_HOUR })
  timeFormat?: TimeFormatOption;

  @Prop({ type: String })
  timezone?: string;
}

@Schema({ _id: false })
export class CurrencyOptions {
  @Prop({ type: String, enum: CurrencySymbolPosition, default: CurrencySymbolPosition.BEFORE })
  symbolPosition?: CurrencySymbolPosition;

  @Prop({ type: String, enum: DecimalSeparator, default: DecimalSeparator.DOT })
  decimalSeparator?: DecimalSeparator;

  @Prop({ type: String, enum: ThousandsSeparator, default: ThousandsSeparator.COMMA })
  thousandsSeparator?: ThousandsSeparator;

  @Prop({ type: Number, default: 2, min: 0, max: 4 })
  decimalPlaces?: number;
}

export const DateOptionsSchema = SchemaFactory.createForClass(DateOptions);
export const CurrencyOptionsSchema = SchemaFactory.createForClass(CurrencyOptions);

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

  @Prop({ type: DateOptionsSchema })
  dateOptions?: DateOptions;

  @Prop({ type: Boolean, default: false })
  ignoreCurrency: boolean;

  @Prop({ type: CurrencyOptionsSchema })
  currencyOptions?: CurrencyOptions;
}

export const ProjectSettingsSchema =
  SchemaFactory.createForClass(ProjectSettings);
