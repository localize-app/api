import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { Role } from 'src/common/enums/role.enum';
import { PERMISSION_KEY } from '../decorators/permission.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

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

    // Check if user is an owner (has all permissions)
    if (user.role === Role.OWNER) {
      return true;
    }

    // Check if user has the specific permission
    if (user.permissions && user.permissions[requiredPermission] === true) {
      return true;
    }

    return false;
  }
}
