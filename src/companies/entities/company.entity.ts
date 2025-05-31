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
}

export const CompanySchema = SchemaFactory.createForClass(Company);
