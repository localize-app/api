import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { User } from 'src/users/entities/user.entity';
import { Company } from 'src/companies/entities/company.entity';
import { Project } from 'src/projects/entities/project.entity';

export type ActivityDocument = HydratedDocument<Activity>;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Activity {
  _id: string;

  id!: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  user: User;

  @Prop({ required: true })
  actionType: string; // e.g., 'created_phrase', 'translated_phrase', 'added_user', etc.

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  details: Record<string, any>; // Additional details about the action

  @Prop({ type: mongoose.Schema.Types.ObjectId, refPath: 'entityType' })
  entityId: mongoose.Schema.Types.ObjectId; // ID of the related entity

  @Prop({ required: true })
  entityType: string; // Model name of the entity ('Project', 'Phrase', 'User', etc.)

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Company' })
  company: Company; // Company context

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Project' })
  project?: Project; // Optional: Project context (if applicable)

  @Prop({ required: true })
  timestamp: Date; // When the action occurred

  @Prop({ default: false })
  isSensitive: boolean; // Whether the activity contains sensitive information
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);
