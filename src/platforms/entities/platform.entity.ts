import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { Company } from 'src/companies/entities/company.entity';

export type PlatformDocument = HydratedDocument<Platform>;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Platform {
  _id: string;

  id!: string;

  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({ type: [String], default: [] }) // Array of supported locales
  supportedLocales: string[];

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
  })
  company: Company[]; // Reference to Platform entities
}

export const PlatformSchema = SchemaFactory.createForClass(Platform);
