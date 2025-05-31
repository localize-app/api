import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  UserPermissions,
  UserPermissionsSchema,
} from 'src/users/entities/user-permissions.entity';

@Schema({ _id: false })
export class CompanyPermissionSettings {
  // Default permissions for each role in this company
  @Prop({ type: UserPermissionsSchema })
  ownerDefaults?: UserPermissions;

  @Prop({ type: UserPermissionsSchema })
  adminDefaults?: UserPermissions;

  @Prop({ type: UserPermissionsSchema })
  managerDefaults?: UserPermissions;

  @Prop({ type: UserPermissionsSchema })
  memberDefaults?: UserPermissions;

  @Prop({ type: UserPermissionsSchema })
  translatorDefaults?: UserPermissions;

  // Whether this company has customized role permissions
  @Prop({ default: false })
  hasCustomRolePermissions: boolean;

  // When permissions were last updated
  @Prop({ type: Date })
  permissionsLastUpdated?: Date;
}

export const CompanyPermissionSettingsSchema = SchemaFactory.createForClass(
  CompanyPermissionSettings,
);
