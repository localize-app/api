import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

import { Company } from 'src/companies/entities/company.entity';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop()
  fullName: string;

  @Prop()
  avatarUrl: string;

  @Prop({ default: false })
  isSystemAdmin: boolean;

  @Prop({ enum: ['owner', 'admin', 'member'], default: 'member' })
  role: string;

  @Prop({ type: mongoose.Schema.Types.Mixed, default: {} })
  permissions: {
    canManageUsers: boolean;
    canManageProjects: boolean;
    canManageLocales: boolean;
    canTranslate: boolean;
    canApproveTranslations: boolean;
  };

  @Prop()
  lastLoginAt?: Date;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Company' }] })
  companies: Company[]; // Add this to create the association
}

export const UserSchema = SchemaFactory.createForClass(User);
