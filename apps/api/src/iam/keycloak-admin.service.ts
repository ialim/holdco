import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { mapRolesToPermissions } from "../auth/permissions.mapper";

type KeycloakUser = {
  id: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  enabled?: boolean;
  attributes?: Record<string, string[]>;
};

type KeycloakRole = {
  id: string;
  name: string;
  description?: string;
  composite?: boolean;
};

type TokenCache = {
  token: string;
  expiresAt: number;
};

const TOKEN_SKEW_MS = 30_000;

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}

function realmFromIssuer(issuer?: string) {
  if (!issuer) return undefined;
  const match = issuer.match(/\/realms\/([^/]+)\/?$/);
  return match?.[1];
}

function baseFromIssuer(issuer?: string) {
  if (!issuer) return undefined;
  const index = issuer.indexOf("/realms/");
  if (index === -1) return issuer.replace(/\/+$/, "");
  return issuer.slice(0, index);
}

@Injectable()
export class KeycloakAdminService {
  private tokenCache?: TokenCache;

  constructor(private readonly prisma: PrismaService) {}

  private getConfig() {
    const issuer = process.env.OIDC_ISSUER;
    const baseUrl = normalizeBaseUrl(
      process.env.KEYCLOAK_BASE_URL || baseFromIssuer(issuer) || "http://localhost:8080",
    );
    const realm = process.env.KEYCLOAK_REALM || realmFromIssuer(issuer);
    if (!realm) {
      throw new BadRequestException("Keycloak realm is not configured");
    }

    return {
      baseUrl,
      realm,
      adminRealm: process.env.KEYCLOAK_ADMIN_REALM || "master",
      adminClientId: process.env.KEYCLOAK_ADMIN_CLIENT_ID || "admin-cli",
      adminClientSecret: process.env.KEYCLOAK_ADMIN_CLIENT_SECRET,
      adminUsername: process.env.KEYCLOAK_ADMIN_USERNAME,
      adminPassword: process.env.KEYCLOAK_ADMIN_PASSWORD,
    };
  }

  private async getAdminToken(): Promise<string> {
    if (this.tokenCache && this.tokenCache.expiresAt > Date.now() + TOKEN_SKEW_MS) {
      return this.tokenCache.token;
    }

    const config = this.getConfig();
    const tokenUrl = `${config.baseUrl}/realms/${encodeURIComponent(
      config.adminRealm,
    )}/protocol/openid-connect/token`;

    const params = new URLSearchParams();
    params.set("client_id", config.adminClientId);

    if (config.adminClientSecret) {
      params.set("client_secret", config.adminClientSecret);
      params.set("grant_type", "client_credentials");
    } else if (config.adminUsername && config.adminPassword) {
      params.set("grant_type", "password");
      params.set("username", config.adminUsername);
      params.set("password", config.adminPassword);
    } else {
      throw new BadRequestException("Keycloak admin credentials are not configured");
    }

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    if (!response.ok) {
      throw new BadRequestException(`Keycloak admin token request failed (${response.status})`);
    }
    const payload = (await response.json()) as { access_token: string; expires_in?: number };
    if (!payload?.access_token) {
      throw new BadRequestException("Keycloak admin token response missing access_token");
    }

    const expiresIn = Number(payload.expires_in ?? 60);
    this.tokenCache = {
      token: payload.access_token,
      expiresAt: Date.now() + expiresIn * 1000,
    };

    return payload.access_token;
  }

  private async fetchAdmin<T>(path: string, init?: RequestInit): Promise<T> {
    const config = this.getConfig();
    const token = await this.getAdminToken();
    const url = `${config.baseUrl}/admin/realms/${encodeURIComponent(config.realm)}${path}`;
    const response = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new BadRequestException(
        `Keycloak admin request failed (${response.status}): ${text || "unknown error"}`,
      );
    }

    if (response.status === 204) {
      return {} as T;
    }

    return (await response.json()) as T;
  }

  async listRoles() {
    const roles = await this.fetchAdmin<KeycloakRole[]>("/roles");
    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description ?? undefined,
      composite: role.composite ?? false,
      permissions: mapRolesToPermissions([role.name]),
    }));
  }

  async listUsers(params: {
    limit: number;
    offset: number;
    q?: string;
    scopeGroupId?: string;
    scopeSubsidiaryId?: string;
    includeUnscoped?: boolean;
  }) {
    const query = new URLSearchParams();
    query.set("first", String(params.offset));
    query.set("max", String(params.limit));
    if (params.q) {
      query.set("search", params.q);
    }

    const countQuery = new URLSearchParams();
    if (params.q) {
      countQuery.set("search", params.q);
    }

    const [users, countResponse] = await Promise.all([
      this.fetchAdmin<KeycloakUser[]>(`/users?${query.toString()}`),
      this.fetchAdmin<number | { count?: number }>(
        `/users/count${countQuery.toString() ? `?${countQuery.toString()}` : ""}`,
      ),
    ]);
    const countValue =
      typeof countResponse === "number"
        ? countResponse
        : typeof countResponse?.count === "number"
          ? countResponse.count
          : users.length;

    const { overrides, scopedUserIds } = await this.syncTenancyAttributesFromDb(
      users,
      params.scopeGroupId,
    );
    const scopedByGroup = params.scopeGroupId
      ? users.filter((user) => {
          if (scopedUserIds.has(user.id)) return true;
          if (!params.includeUnscoped) return false;
          const attributes = overrides.get(user.id) ?? user.attributes;
          const groupId = attributes?.groupId?.[0];
          return !groupId;
        })
      : users;
    const scopedUsers = params.scopeSubsidiaryId
      ? scopedByGroup.filter((user) => {
          const attributes = overrides.get(user.id) ?? user.attributes;
          return this.hasAttributeValue(
            attributes ? { ...user, attributes } : user,
            "subsidiaryId",
            params.scopeSubsidiaryId as string,
          );
        })
      : scopedByGroup;

    const data = await Promise.all(
      scopedUsers.map(async (user) => {
        const roles = await this.fetchAdmin<KeycloakRole[]>(
          `/users/${encodeURIComponent(user.id)}/role-mappings/realm`,
        );
        const roleNames = roles.map((role) => role.name);
        const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
        const attributes = overrides.get(user.id) ?? user.attributes;
        return {
          id: user.id,
          username: user.username,
          email: user.email ?? undefined,
          name: name || undefined,
          enabled: user.enabled ?? false,
          group_id: attributes?.groupId?.[0],
          subsidiary_id: attributes?.subsidiaryId?.[0],
          location_id: attributes?.locationId?.[0],
          roles: roleNames,
          permissions: mapRolesToPermissions(roleNames),
        };
      }),
    );

    return {
      data,
      meta: {
        limit: params.limit,
        offset: params.offset,
        total: params.scopeGroupId || params.scopeSubsidiaryId ? data.length : countValue,
      },
    };
  }

  async assignUserRoles(params: { userId: string; roles: string[]; scopeGroupId?: string }) {
    if (!params.roles.length) {
      throw new BadRequestException("At least one role is required");
    }

    if (params.scopeGroupId) {
      await this.assertGroupScope(params.userId, params.scopeGroupId);
    }

    const roleRepresentations = await Promise.all(
      params.roles.map((role) =>
        this.fetchAdmin<KeycloakRole>(`/roles/${encodeURIComponent(role)}`),
      ),
    );

    await this.fetchAdmin(`/users/${encodeURIComponent(params.userId)}/role-mappings/realm`, {
      method: "POST",
      body: JSON.stringify(
        roleRepresentations.map((role) => ({
          id: role.id,
          name: role.name,
        })),
      ),
    });

    return {
      user_id: params.userId,
      roles: roleRepresentations.map((role) => role.name),
    };
  }

  async updateUserAttributes(params: {
    userId: string;
    groupId?: string;
    subsidiaryId?: string;
    locationId?: string;
    scopeGroupId?: string;
  }) {
    const user = await this.getUser(params.userId);
    if (params.scopeGroupId) {
      const currentGroup = user.attributes?.groupId?.[0];
      if (currentGroup && currentGroup !== params.scopeGroupId) {
        throw new ForbiddenException("User is outside the allowed group scope");
      }
      if (params.groupId && params.groupId !== params.scopeGroupId) {
        throw new ForbiddenException("Cannot assign user to a different group scope");
      }
    }
    const attributes = { ...(user.attributes ?? {}) };

    if (params.groupId !== undefined) {
      attributes.groupId = params.groupId ? [params.groupId] : [];
    }
    if (params.subsidiaryId !== undefined) {
      attributes.subsidiaryId = params.subsidiaryId ? [params.subsidiaryId] : [];
    }
    if (params.locationId !== undefined) {
      attributes.locationId = params.locationId ? [params.locationId] : [];
    }

    await this.fetchAdmin(`/users/${encodeURIComponent(params.userId)}`, {
      method: "PUT",
      body: JSON.stringify({
        attributes,
      }),
    });

    return {
      user_id: params.userId,
      group_id: attributes.groupId?.[0],
      subsidiary_id: attributes.subsidiaryId?.[0],
      location_id: attributes.locationId?.[0],
    };
  }

  private async getUser(userId: string) {
    return this.fetchAdmin<KeycloakUser>(`/users/${encodeURIComponent(userId)}`);
  }

  private async assertGroupScope(userId: string, scopeGroupId: string) {
    const user = await this.getUser(userId);
    if (!this.hasAttributeValue(user, "groupId", scopeGroupId)) {
      throw new ForbiddenException("User is outside the allowed group scope");
    }
  }

  private hasAttributeValue(user: KeycloakUser, key: string, value: string) {
    const values = user.attributes?.[key];
    return Array.isArray(values) && values.includes(value);
  }

  private async syncTenancyAttributesFromDb(users: KeycloakUser[], scopeGroupId?: string) {
    const overrides = new Map<string, KeycloakUser["attributes"]>();
    const scopedUserIds = new Set<string>();

    for (const user of users) {
      if (scopeGroupId && this.hasAttributeValue(user, "groupId", scopeGroupId)) {
        scopedUserIds.add(user.id);
      }
    }

    if (!scopeGroupId || !users.length) {
      return { overrides, scopedUserIds };
    }

    const candidates = users.filter(
      (user) =>
        !user.attributes?.groupId?.length ||
        !user.attributes?.subsidiaryId?.length ||
        !user.attributes?.locationId?.length,
    );

    const emails = candidates
      .map((user) => user.email || (user.username?.includes("@") ? user.username : undefined))
      .filter(Boolean) as string[];

    if (!emails.length) {
      return { overrides, scopedUserIds };
    }

    const dbUsers = await this.prisma.user.findMany({
      where: { groupId: scopeGroupId, email: { in: emails } },
      select: { id: true, email: true },
    });

    if (!dbUsers.length) {
      return { overrides, scopedUserIds };
    }

    const dbUserByEmail = new Map<string, { id: string }>();
    for (const user of dbUsers) {
      dbUserByEmail.set(user.email, { id: user.id });
    }

    const userRoles = await this.prisma.userRole.findMany({
      where: { userId: { in: dbUsers.map((user) => user.id) } },
      select: { userId: true, subsidiaryId: true, locationId: true },
    });

    const subsidiaryByUser = new Map<string, Set<string>>();
    const locationByUser = new Map<string, Set<string>>();

    for (const role of userRoles) {
      if (role.subsidiaryId) {
        const set = subsidiaryByUser.get(role.userId) ?? new Set<string>();
        set.add(role.subsidiaryId);
        subsidiaryByUser.set(role.userId, set);
      }
      if (role.locationId) {
        const set = locationByUser.get(role.userId) ?? new Set<string>();
        set.add(role.locationId);
        locationByUser.set(role.userId, set);
      }
    }

    await Promise.all(
      candidates.map(async (user) => {
        const email = user.email || (user.username?.includes("@") ? user.username : undefined);
        if (!email) return;
        const dbUser = dbUserByEmail.get(email);
        if (!dbUser) return;

        const currentGroup = user.attributes?.groupId?.[0];
        if (currentGroup && currentGroup !== scopeGroupId) {
          return;
        }

        scopedUserIds.add(user.id);

        const existing = user.attributes ?? {};
        const next: Record<string, string[]> = { ...existing };
        let changed = false;

        if (!existing.groupId?.length) {
          next.groupId = [scopeGroupId];
          changed = true;
        }

        if (!existing.subsidiaryId?.length) {
          const subsidiaries = subsidiaryByUser.get(dbUser.id);
          if (subsidiaries && subsidiaries.size === 1) {
            next.subsidiaryId = [Array.from(subsidiaries)[0]];
            changed = true;
          }
        }

        if (!existing.locationId?.length) {
          const locations = locationByUser.get(dbUser.id);
          if (locations && locations.size === 1) {
            next.locationId = [Array.from(locations)[0]];
            changed = true;
          }
        }

        if (!changed) return;

        try {
          await this.updateUserAttributes({
            userId: user.id,
            groupId: next.groupId?.[0],
            subsidiaryId: next.subsidiaryId?.[0],
            locationId: next.locationId?.[0],
            scopeGroupId,
          });
          overrides.set(user.id, next);
        } catch {
          // Ignore auto-sync failures so list calls still succeed.
        }
      }),
    );

    return { overrides, scopedUserIds };
  }
}
