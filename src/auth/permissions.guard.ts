import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<string[]>('permissions', context.getHandler());
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }
    
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user) {
      throw new ForbiddenException('User not found in request');
    }
    
    // Admin bypasses all permission checks
    if (user.role === 'Admin' || user.role === 'System Admin') {
      return true;
    }

    const hasPermission = requiredPermissions.some((permission) => 
      user.permissions?.includes(permission)
    );
    
    if (!hasPermission) {
      throw new ForbiddenException(`Missing required permissions: ${requiredPermissions.join(', ')}`);
    }
    
    return true;
  }
}
