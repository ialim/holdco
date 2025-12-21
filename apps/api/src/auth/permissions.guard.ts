import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PERMISSIONS_KEY } from "./permissions.decorator";
import { mapRolesToPermissions } from "./permissions.mapper";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    const req = ctx.switchToHttp().getRequest();
    if (!req.user) {
      req.user = {};
    }

    let userPermissions: string[] = Array.isArray(req.user.permissions) ? req.user.permissions : [];

    if (!userPermissions.length && Array.isArray(req.user.roles) && req.user.roles.length) {
      userPermissions = mapRolesToPermissions(req.user.roles);
      req.user.permissions = userPermissions;
    }

    if (!required?.length) return true;

    if (userPermissions.includes("*")) {
      return true;
    }

    const ok = required.every((permission) => userPermissions.includes(permission));
    if (!ok) throw new ForbiddenException("Insufficient permissions");
    return true;
  }
}
