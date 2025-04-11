import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { Role } from 'src/common/enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    // Check if user has required role
    if (requiredRoles.includes(user.role)) {
      return true;
    }

    // Check if user is system admin (has full access)
    if (user.isSystemAdmin) {
      return true;
    }

    // Check specific permissions based on the route
    const handler = context.getHandler().name;

    // Example of checking specific permissions
    if (handler.includes('create') && user.permissions?.canManageProjects) {
      return true;
    }

    if (handler.includes('update') && user.permissions?.canManageProjects) {
      return true;
    }

    if (handler.includes('remove') && user.permissions?.canManageProjects) {
      return true;
    }

    return false;
  }
}
