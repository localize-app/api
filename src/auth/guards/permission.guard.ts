import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PERMISSION_KEY } from '../decorators/permission.decorator';
import { RolePermissionsService } from '../role-permission.service';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rolePermissionsService: RolePermissionsService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermission = this.reflector.getAllAndOverride<string>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermission) {
      return true; // No permission required
    }

    const { user } = context.switchToHttp().getRequest();

    // System admins have all permissions
    if (user.isSystemAdmin) {
      return true;
    }

    // Check if the user's role has the required permission
    return this.rolePermissionsService.hasPermission(
      user.role,
      requiredPermission,
    );
  }
}
