import { Injectable, NestMiddleware, UnauthorizedException } from "@nestjs/common";
import { verify } from "jsonwebtoken";
import { mapRolesToPermissions } from "./permissions.mapper";

@Injectable()
export class JwtAuthMiddleware implements NestMiddleware {
  use(req: any, _res: any, next: () => void) {
    const header = req.headers?.authorization;
    if (!header) {
      return next();
    }

    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) {
      throw new UnauthorizedException("Invalid authorization header");
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new UnauthorizedException("JWT secret not configured");
    }

    try {
      const payload = verify(token, secret);
      const user = typeof payload === "string" ? { sub: payload } : payload;
      const permissions = Array.isArray((user as any).permissions) ? (user as any).permissions : [];
      const roles = Array.isArray((user as any).roles) ? (user as any).roles : [];

      req.user = {
        ...(user as Record<string, unknown>),
        permissions: permissions.length ? permissions : mapRolesToPermissions(roles),
      };
    } catch (error) {
      throw new UnauthorizedException("Invalid token");
    }

    return next();
  }
}
