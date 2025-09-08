import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { Project } from 'src/projects/entities/project.entity';
import { BaseEntity, baseSchemaOptions } from 'src/common/entities/base.entity';
import {
  CompanyPermissionSettings,
  CompanyPermissionSettingsSchema,
} from './company-permission-settings.entity';

export type CompanyDocument = HydratedDocument<Company>;

@Schema(baseSchemaOptions)
export class Company extends BaseEntity {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
  })
  projects: Project[]; // Reference to Project entities

  // NEW: Company-level permission settings
  @Prop({ type: CompanyPermissionSettingsSchema })
  permissionSettings?: CompanyPermissionSettings;

  // Organization management fields
  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 10 })
  maxProjects: number;

  @Prop({ default: 50 })
  maxTeamMembers: number;

  @Prop({ default: Date.now })
  activatedAt: Date;

  @Prop()
  deactivatedAt?: Date;

  @Prop()
  deactivatedBy?: mongoose.Schema.Types.ObjectId; // Reference to admin user who deactivated
}

export const CompanySchema = SchemaFactory.createForClass(Company);
