import * as mongoose from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { User } from 'src/users/entities/user.entity';
import { Platform } from 'src/platforms/entities/platform.entity';

export type CompanyDocument = mongoose.HydratedDocument<Company>;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Company {
  _id: string;

  id!: string;

  @Prop({ required: true, unique: true })
  name: string;

  @Prop()
  description?: string;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Platform' }],
  })
  platforms: Platform[]; // Reference to Platform entities

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] })
  users: User[];
}

export const CompanySchema = SchemaFactory.createForClass(Company);
