import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, ROLE_KEY } from '../auth.constants';
import { CurrentUser } from '../decorators/current-user.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const user = request.user as CurrentUser;

    if (!requiredPermissions?.length && !requiredRoles?.length) {
      return true;
    }

    if (!user) {
      throw new ForbiddenException('Not authenticated');
    }

    if (requiredRoles?.length) {
      if (!requiredRoles.some((r) => r === user.roleName)) {
        throw new ForbiddenException('Insufficient role');
      }
    }

    if (requiredPermissions?.length) {
      const hasAll = requiredPermissions.every((p) => user.permissions.includes(p));
      if (!hasAll) {
        throw new ForbiddenException('Insufficient permissions');
      }
    }

    return true;
  }
}