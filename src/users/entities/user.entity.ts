import * as mongoose from 'mongoose';
import { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { Company } from 'src/companies/entities/company.entity';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string; // Store the hashed password

  @Prop({ required: true })
  firstName: string;

  @Prop()
  lastName?: string;

  @Prop({ default: [] })
  roles: string[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Company' })
  company: Company; // Companies this user belongs to
}

export const UserSchema = SchemaFactory.createForClass(User);
