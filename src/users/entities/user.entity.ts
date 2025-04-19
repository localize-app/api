import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

import { Role } from 'src/common/enums/role.enum';
import { Company } from 'src/companies/entities/company.entity';
import { BaseEntity, baseSchemaOptions } from 'src/common/entities/base.entity';
import { RolePermissionsService } from 'src/auth/role-permission.service';

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
  company: Company; // Changed from companies array to single company reference
}

export const UserSchema = SchemaFactory.createForClass(User);

// Add virtual getter for fullName
UserSchema.virtual('fullName').get(function () {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.firstName;
});

// Add virtual getter for permissions based on role
UserSchema.virtual('permissions').get(function () {
  // This will need to be injected properly in a real implementation
  const rolePermissionsService = new RolePermissionsService();
  return rolePermissionsService.getPermissionsForRole(this.role);
});
