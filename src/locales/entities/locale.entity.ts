import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { Project } from 'src/projects/entities/project.entity';
import { BaseEntity, baseSchemaOptions } from 'src/common/entities/base.entity';
import { LocaleCode } from 'src/common/enums/locale-code.enum';

export type LocaleDocument = HydratedDocument<Locale>;

@Schema(baseSchemaOptions)
export class Locale extends BaseEntity {
  @Prop({
    required: true,
    unique: true,
    enum: Object.values(LocaleCode),
    type: String,
  })
  code: LocaleCode; // Now using enum

  @Prop({ required: true })
  language: string; // e.g., 'English'

  // locale object with type any
  @Prop({ type: mongoose.Schema.Types.Mixed })
  content: any;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
  })
  projects?: Project[]; // Optional: Projects that support this locale
}

export const LocaleSchema = SchemaFactory.createForClass(Locale);
