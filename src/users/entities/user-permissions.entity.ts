// src/users/entities/user-permissions.entity.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false }) // Subdocument schema
export class UserPermissions {
  // User management
  @Prop({ type: Boolean, default: false })
  canManageUsers: boolean;

  @Prop({ type: Boolean, default: false })
  canInviteUsers: boolean;

  @Prop({ type: Boolean, default: false })
  canRemoveUsers: boolean;

  // Project management
  @Prop({ type: Boolean, default: false })
  canCreateProjects: boolean;

  @Prop({ type: Boolean, default: false })
  canManageProjects: boolean;

  @Prop({ type: Boolean, default: false })
  canArchiveProjects: boolean;

  // Content management
  @Prop({ type: Boolean, default: false })
  canCreatePhrases: boolean;

  @Prop({ type: Boolean, default: false })
  canEditPhrases: boolean;

  @Prop({ type: Boolean, default: false })
  canDeletePhrases: boolean;

  @Prop({ type: Boolean, default: false })
  canTranslate: boolean;

  @Prop({ type: Boolean, default: false })
  canApproveTranslations: boolean;

  // Locale management
  @Prop({ type: Boolean, default: false })
  canManageLocales: boolean;

  // Glossary management
  @Prop({ type: Boolean, default: false })
  canManageGlossary: boolean;

  // Integration management
  @Prop({ type: Boolean, default: false })
  canManageIntegrations: boolean;

  // Settings management
  @Prop({ type: Boolean, default: false })
  canManageSettings: boolean;

  // Order management
  @Prop({ type: Boolean, default: false })
  canCreateOrders: boolean;

  @Prop({ type: Boolean, default: false })
  canViewOrders: boolean;

  @Prop({ type: Boolean, default: false })
  canManageOrders: boolean;

  // Reports and analytics
  @Prop({ type: Boolean, default: false })
  canViewReports: boolean;

  @Prop({ type: Boolean, default: false })
  canExportData: boolean;
}

export const UserPermissionsSchema =
  SchemaFactory.createForClass(UserPermissions);
