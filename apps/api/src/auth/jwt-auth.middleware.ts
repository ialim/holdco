import { Injectable, NestMiddleware, UnauthorizedException } from "@nestjs/common";
import { createPublicKey } from "crypto";
import { decode, verify, type Algorithm, type VerifyOptions } from "jsonwebtoken";
import { mapRolesToPermissions } from "./permissions.mapper";

type JsonRecord = Record<string, unknown>;

function buildPrincipal(payload: unknown) {
  const user = typeof payload === "string" ? { sub: payload } : payload;
  const subject = (user as any).sub ?? (user as any).id ?? (user as any).userId;
  if (!subject) {
    throw new UnauthorizedException("Token subject is required");
  }
  const permissions = Array.isArray((user as any).permissions) ? (user as any).permissions : [];
  const roles = Array.isArray((user as any).roles) ? (user as any).roles : [];

  return {
    ...(user as JsonRecord),
    sub: subject,
    permissions: permissions.length ? permissions : mapRolesToPermissions(roles),
  };
}

function extractBearerToken(value: string | undefined) {
  if (!value) return undefined;
  if (value.startsWith("Bearer ")) return value.slice("Bearer ".length);
  return value;
}

const HS_ALGORITHMS: Algorithm[] = ["HS256", "HS384", "HS512"];
const OIDC_ALGORITHMS: Algorithm[] = ["RS256", "RS384", "RS512", "ES256", "ES384", "ES512"];
const JWKS_CACHE_TTL_MS = 5 * 60 * 1000;

let jwksCache: { keys: JsonRecord[]; expiresAt: number; uri?: string } = {
  keys: [],
  expiresAt: 0,
  uri: undefined,
};
let discoveryCache: { issuer?: string; jwksUri?: string; expiresAt: number } = { expiresAt: 0 };

async function fetchJson(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`OIDC fetch failed: ${response.status}`);
  }
  return response.json() as Promise<JsonRecord>;
}

async function resolveJwksUri() {
  const explicit = process.env.OIDC_JWKS_URI;
  if (explicit) return explicit;
  const issuer = process.env.OIDC_ISSUER;
  if (!issuer) return undefined;

  if (discoveryCache.jwksUri && discoveryCache.expiresAt > Date.now()) {
    return discoveryCache.jwksUri;
  }

  const configUrl = issuer.replace(/\/+$/, "") + "/.well-known/openid-configuration";
  const config = await fetchJson(configUrl);
  const jwksUri = typeof config.jwks_uri === "string" ? config.jwks_uri : undefined;
  discoveryCache = {
    issuer,
    jwksUri,
    expiresAt: Date.now() + JWKS_CACHE_TTL_MS,
  };
  return jwksUri;
}

async function loadJwks() {
  const jwksUri = await resolveJwksUri();
  if (!jwksUri) return [];

  if (jwksCache.uri === jwksUri && jwksCache.expiresAt > Date.now()) {
    return jwksCache.keys;
  }

  const jwks = await fetchJson(jwksUri);
  const keys = Array.isArray(jwks.keys) ? jwks.keys : [];
  jwksCache = {
    keys,
    expiresAt: Date.now() + JWKS_CACHE_TTL_MS,
    uri: jwksUri,
  };
  return keys;
}

function isOidcEnabled() {
  return Boolean(process.env.OIDC_ISSUER || process.env.OIDC_JWKS_URI);
}

function getJwtHeader(token: string) {
  const decoded = decode(token, { complete: true });
  if (!decoded || typeof decoded !== "object") return undefined;
  return decoded.header as { alg?: string; kid?: string } | undefined;
}

function shouldUseOidc(token: string) {
  if (!isOidcEnabled()) return false;
  const header = getJwtHeader(token);
  if (!header?.kid) return false;
  if (!header.alg) return false;
  return !header.alg.startsWith("HS");
}

function verifyWithSecrets(token: string, secrets: string[]) {
  let lastError: unknown;
  for (const candidate of secrets) {
    try {
      return verify(token, candidate, { algorithms: HS_ALGORITHMS });
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError ?? new UnauthorizedException("Invalid token");
}

async function verifyWithOidc(token: string) {
  const header = getJwtHeader(token);
  if (!header?.kid) throw new UnauthorizedException("OIDC token kid is required");

  const keys = await loadJwks();
  const jwk = keys.find((key) => key.kid === header.kid);
  if (!jwk) throw new UnauthorizedException("OIDC signing key not found");

  const issuer = process.env.OIDC_ISSUER;
  const audience = process.env.OIDC_AUDIENCE;
  const publicKey = createPublicKey({ key: jwk, format: "jwk" });
  const options: VerifyOptions = { algorithms: OIDC_ALGORITHMS };
  if (issuer) options.issuer = issuer;
  if (audience) options.audience = audience;

  return verify(token, publicKey, options);
}

async function verifyToken(token: string, secrets: string[]) {
  if (shouldUseOidc(token)) {
    return verifyWithOidc(token);
  }
  if (!secrets.length) {
    throw new UnauthorizedException("JWT secret not configured");
  }
  return verifyWithSecrets(token, secrets);
}

@Injectable()
export class JwtAuthMiddleware implements NestMiddleware {
  async use(req: any, _res: any, next: () => void) {
    const header = req.headers?.authorization;
    if (!header) {
      return next();
    }

    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) {
      throw new UnauthorizedException("Invalid authorization header");
    }

    const secret = process.env.JWT_SECRET;
    const previousSecret = process.env.JWT_SECRET_PREVIOUS;

    try {
      const secrets = [secret, previousSecret].filter(Boolean) as string[];
      const payload = await verifyToken(token, secrets);
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
