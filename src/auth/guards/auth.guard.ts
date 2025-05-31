// src/auth/guards/auth.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLES_KEY } from '../decorators/roles.decorator';
import { PERMISSION_KEY } from '../decorators/permission.decorator';
import { RolePermissionsService } from '../role-permission.service';

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rolePermissionsService: RolePermissionsService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // Check for role-based access first
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Check for permission-based access
    const requiredPermission = this.reflector.getAllAndOverride<string>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no authorization requirements, allow access
    if (!requiredRoles && !requiredPermission) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    // Check role-based access if required
    if (requiredRoles && requiredRoles.includes(user.role)) {
      return true;
    }

    // Check permission-based access if required
    if (requiredPermission) {
      return this.rolePermissionsService.hasPermission(
        user.permissions, // This will now be the stored permissions from DB
        user.role,
        requiredPermission,
      );
    }

    return false;
  }
}
