import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

import { Project } from 'src/projects/entities/project.entity';
import { BaseEntity, baseSchemaOptions } from 'src/common/entities/base.entity';

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
}

export const CompanySchema = SchemaFactory.createForClass(Company);
