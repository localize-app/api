// src/auth/role-permission.service.ts
import { Injectable } from '@nestjs/common';
import { Role } from 'src/common/enums/role.enum';
import { CompanyPermissionSettings } from 'src/companies/entities/company-permission-settings.entity';
import { UserPermissions } from 'src/users/entities/user-permissions.entity';

/**
 * Central service for managing role-based permissions and custom permissions
 */
@Injectable()
export class RolePermissionsService {
  /**
   * Check if a user has a specific permission
   * This checks actual stored permissions first, then falls back to role-based permissions
   */
  hasPermission(
    userPermissions: UserPermissions | undefined,
    role: string,
    permission: string,
  ): boolean {
    // System admins always have all permissions
    if (role === 'admin') {
      return true;
    }

    // If user has custom permissions stored, use those
    if (
      userPermissions &&
      userPermissions[permission as keyof UserPermissions] !== undefined
    ) {
      return userPermissions[permission as keyof UserPermissions] as boolean;
    }

    // Fall back to role-based permissions
    const rolePermissions = this.getPermissionsForRole(role);
    return !!rolePermissions[permission];
  }

  /**
   * Get effective permissions for a user (combining role defaults with custom overrides)
   */
  getEffectivePermissions(
    userPermissions: UserPermissions | undefined,
    role: string,
  ): UserPermissions {
    // Start with role-based permissions as defaults
    const rolePermissions = this.getPermissionsForRole(role);

    // If no custom permissions, return role permissions
    if (!userPermissions) {
      return rolePermissions as unknown as UserPermissions;
    }

    // Merge custom permissions with role permissions
    const effectivePermissions: UserPermissions =
      rolePermissions as unknown as UserPermissions;

    // Override with any custom permissions that are explicitly set
    Object.keys(userPermissions).forEach((key) => {
      const permissionKey = key as keyof UserPermissions;
      if (userPermissions[permissionKey] !== undefined) {
        effectivePermissions[permissionKey] = userPermissions[permissionKey];
      }
    });

    return effectivePermissions;
  }

  /**
   * Get default permissions for a specific role (unchanged from original)
   */
  getPermissionsForRole(role: string): Record<string, boolean> {
    switch (role) {
      case Role.OWNER:
        return {
          // User management
          canManageUsers: true,
          canInviteUsers: true,
          canRemoveUsers: true,

          // Project management
          canCreateProjects: true,
          canManageProjects: true,
          canArchiveProjects: true,

          // Content management
          canCreatePhrases: true,
          canEditPhrases: true,
          canDeletePhrases: true,
          canTranslate: true,
          canApproveTranslations: true,

          // Locale management
          canManageLocales: true,

          // Glossary management
          canManageGlossary: true,

          // Integration management
          canManageIntegrations: true,

          // Settings management
          canManageSettings: true,

          // Reports and analytics
          canViewReports: true,
          canExportData: true,
        };

      case Role.ADMIN:
        return {
          // User management
          canManageUsers: true,
          canInviteUsers: true,
          canRemoveUsers: false,

          // Project management
          canCreateProjects: true,
          canManageProjects: true,
          canArchiveProjects: true,

          // Content management
          canCreatePhrases: true,
          canEditPhrases: true,
          canDeletePhrases: true,
          canTranslate: true,
          canApproveTranslations: true,

          // Locale management
          canManageLocales: true,

          // Glossary management
          canManageGlossary: true,

          // Integration management
          canManageIntegrations: true,

          // Settings management
          canManageSettings: false,

          // Reports and analytics
          canViewReports: true,
          canExportData: true,
        };

      case Role.MANAGER:
        return {
          // User management
          canManageUsers: false,
          canInviteUsers: true,
          canRemoveUsers: false,

          // Project management
          canCreateProjects: false,
          canManageProjects: true,
          canArchiveProjects: false,

          // Content management
          canCreatePhrases: true,
          canEditPhrases: true,
          canDeletePhrases: false,
          canTranslate: true,
          canApproveTranslations: true,

          // Locale management
          canManageLocales: true,

          // Glossary management
          canManageGlossary: true,

          // Integration management
          canManageIntegrations: false,

          // Settings management
          canManageSettings: false,

          // Reports and analytics
          canViewReports: true,
          canExportData: true,
        };

      case Role.TRANSLATOR:
        return {
          // User management
          canManageUsers: false,
          canInviteUsers: false,
          canRemoveUsers: false,

          // Project management
          canCreateProjects: false,
          canManageProjects: false,
          canArchiveProjects: false,

          // Content management
          canCreatePhrases: false,
          canEditPhrases: false,
          canDeletePhrases: false,
          canTranslate: true,
          canApproveTranslations: false,

          // Locale management
          canManageLocales: false,

          // Glossary management
          canManageGlossary: false,

          // Integration management
          canManageIntegrations: false,

          // Settings management
          canManageSettings: false,

          // Reports and analytics
          canViewReports: false,
          canExportData: false,
        };

      case Role.MEMBER:
      default:
        return {
          // User management
          canManageUsers: false,
          canInviteUsers: false,
          canRemoveUsers: false,

          // Project management
          canCreateProjects: false,
          canManageProjects: false,
          canArchiveProjects: false,

          // Content management
          canCreatePhrases: true,
          canEditPhrases: true,
          canDeletePhrases: false,
          canTranslate: true,
          canApproveTranslations: false,

          // Locale management
          canManageLocales: false,

          // Glossary management
          canManageGlossary: false,

          // Integration management
          canManageIntegrations: false,

          // Settings management
          canManageSettings: false,

          // Reports and analytics
          canViewReports: true,
          canExportData: false,
        };
    }
  }

  createDefaultPermissions(role: string): UserPermissions {
    const rolePermissions = this.getPermissionsForRole(role);
    return rolePermissions as unknown as UserPermissions;
  }

  /**
   * Check if permissions differ from role defaults
   */
  hasCustomizedPermissions(
    permissions: UserPermissions,
    role: string,
  ): boolean {
    const defaultPermissions = this.getPermissionsForRole(role);

    return Object.keys(defaultPermissions).some((key) => {
      const permissionKey = key as keyof UserPermissions;
      return permissions[permissionKey] !== defaultPermissions[key];
    });
  }

  /**
   * Get default permissions for a role, with optional company overrides
   */
  getPermissionsForRoleInCompany(
    role: string,
    companyPermissionSettings?: CompanyPermissionSettings,
  ): Record<string, boolean> {
    // Check if company has custom role permissions
    if (companyPermissionSettings?.hasCustomRolePermissions) {
      const roleKey =
        `${role.toLowerCase()}Defaults` as keyof CompanyPermissionSettings;
      const companyRolePermissions = companyPermissionSettings[roleKey];

      if (
        companyRolePermissions &&
        typeof companyRolePermissions === 'object' &&
        !(companyRolePermissions instanceof Date)
      ) {
        return companyRolePermissions as unknown as Record<string, boolean>;
      }
    }

    // Fall back to system defaults
    return this.getPermissionsForRole(role);
  }

  /**
   * Create default permissions for a role within a company context
   */
  createDefaultPermissionsForCompany(
    role: string,
    companyPermissionSettings?: CompanyPermissionSettings,
  ): UserPermissions {
    const permissions = this.getPermissionsForRoleInCompany(
      role,
      companyPermissionSettings,
    );
    return permissions as unknown as UserPermissions;
  }

  /**
   * Check if permissions differ from company role defaults
   */
  hasCustomizedPermissionsInCompany(
    permissions: UserPermissions,
    role: string,
    companyPermissionSettings?: CompanyPermissionSettings,
  ): boolean {
    const defaultPermissions = this.getPermissionsForRoleInCompany(
      role,
      companyPermissionSettings,
    );

    return Object.keys(defaultPermissions).some((key) => {
      const permissionKey = key as keyof UserPermissions;
      return permissions[permissionKey] !== defaultPermissions[key];
    });
  }
}
