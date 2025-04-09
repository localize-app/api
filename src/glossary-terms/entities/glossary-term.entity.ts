import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Company } from 'src/companies/entities/company.entity';
import { User } from 'src/users/entities/user.entity';
import { Project } from 'src/projects/entities/project.entity';

export type GlossaryTermDocument = HydratedDocument<GlossaryTerm>;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class GlossaryTerm {
  _id: string;

  id!: string;

  @Prop({ required: true })
  term: string;

  @Prop()
  description?: string;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  translations: Record<string, string>; // locale code -> translated term

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  })
  company: Company;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }] })
  projects?: Project[]; // Optional: specific projects this term applies to

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
  createdBy: User;

  @Prop({ default: false })
  isGlobal: boolean; // Whether term applies to all projects

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: [String], default: [] })
  tags: string[];
}

export const GlossaryTermSchema = SchemaFactory.createForClass(GlossaryTerm);
