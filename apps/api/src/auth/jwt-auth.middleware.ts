import { Injectable, NestMiddleware, UnauthorizedException } from "@nestjs/common";
import { verify } from "jsonwebtoken";
import { mapRolesToPermissions } from "./permissions.mapper";

function buildPrincipal(payload: unknown) {
  const user = typeof payload === "string" ? { sub: payload } : payload;
  const subject = (user as any).sub ?? (user as any).id ?? (user as any).userId;
  if (!subject) {
    throw new UnauthorizedException("Token subject is required");
  }
  const permissions = Array.isArray((user as any).permissions) ? (user as any).permissions : [];
  const roles = Array.isArray((user as any).roles) ? (user as any).roles : [];

  return {
    ...(user as Record<string, unknown>),
    sub: subject,
    permissions: permissions.length ? permissions : mapRolesToPermissions(roles),
  };
}

function extractBearerToken(value: string | undefined) {
  if (!value) return undefined;
  if (value.startsWith("Bearer ")) return value.slice("Bearer ".length);
  return value;
}

function verifyWithSecrets(token: string, secrets: string[]) {
  let lastError: unknown;
  for (const candidate of secrets) {
    try {
      return verify(token, candidate);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError ?? new UnauthorizedException("Invalid token");
}

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
    const previousSecret = process.env.JWT_SECRET_PREVIOUS;

    try {
      const secrets = [secret, previousSecret].filter(Boolean) as string[];
      const payload = verifyWithSecrets(token, secrets);
      req.user = buildPrincipal(payload);

      const cashierHeader = req.headers?.["x-cashier-token"] ?? req.headers?.["x-cashier-authorization"];
      const cashierToken = extractBearerToken(Array.isArray(cashierHeader) ? cashierHeader[0] : cashierHeader);
      if (cashierToken) {
        try {
          const cashierPayload = verifyWithSecrets(cashierToken, secrets);
          req.cashier = buildPrincipal(cashierPayload);
        } catch (cashierError) {
          req.cashier = undefined;
        }
      }
    } catch (error) {
      throw new UnauthorizedException("Invalid token");
    }

    return next();
  }
}
