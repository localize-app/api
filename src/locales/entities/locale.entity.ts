import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { Project } from 'src/projects/entities/project.entity';

export type LocaleDocument = mongoose.HydratedDocument<Locale>;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Locale {
  _id: string;

  id!: string;

  @Prop({ required: true, unique: true })
  code: string; // e.g., 'en-US'

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
