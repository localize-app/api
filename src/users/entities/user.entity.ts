// src/users/entities/user.entity.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

import { Role } from '../../common/enums/role.enum';
import { Company } from '../../companies/entities/company.entity';
import { BaseEntity, baseSchemaOptions } from '../../common/entities/base.entity';
import {
  UserPermissions,
  UserPermissionsSchema,
} from './user-permissions.entity';

export type UserDocument = HydratedDocument<User>;

@Schema(baseSchemaOptions)
export class User extends BaseEntity {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true })
  firstName: string;

  @Prop()
  lastName?: string;

  @Prop()
  avatarUrl?: string;

  @Prop({
    enum: Object.values(Role),
    default: Role.MEMBER,
    type: String,
  })
  role: string;

  @Prop({ type: Date })
  lastLoginAt?: Date;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Company' })
  company: Company;

  // NEW: Store actual permissions in database
  @Prop({ type: UserPermissionsSchema })
  permissions?: UserPermissions;

  // NEW: Track if permissions are customized from role defaults
  @Prop({ default: false })
  hasCustomPermissions: boolean;

  // NEW: Track when permissions were last updated
  @Prop({ type: Date })
  permissionsLastUpdated?: Date;

  // SECURITY: Token version for invalidating all user sessions
  @Prop({ default: 0 })
  tokenVersion: number;

  // Password reset functionality
  @Prop()
  passwordResetToken?: string;

  @Prop()
  passwordResetExpires?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Add virtual getter for fullName
UserSchema.virtual('fullName').get(function () {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.firstName;
});
