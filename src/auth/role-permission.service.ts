import { Injectable } from '@nestjs/common';
import { Role } from 'src/common/enums/role.enum';

/**
 * Central service for managing role-based permissions
 * This allows us to define permissions per role in a single place
 */
@Injectable()
export class RolePermissionsService {
  /**
   * Check if a user with the given role has a specific permission
   */
  hasPermission(role: string, permission: string): boolean {
    // System admins have all permissions
    if (role === 'system_admin') {
      return true;
    }

    const permissions = this.getPermissionsForRole(role);
    return !!permissions[permission];
  }

  /**
   * Get all permissions for a specific role
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
}
