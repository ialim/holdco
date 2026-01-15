import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

const ROLE_LEVELS: Record<string, number> = {
  SUPER_ADMIN: 3,
  HOLDCO_ADMIN: 2,
  GROUP_ADMIN: 1,
};

const PRIVILEGED_ROLES = new Set(Object.keys(ROLE_LEVELS));

function normalizeRoleName(role: string) {
  const normalized = role.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_");
  return normalized.startsWith("ROLE_") ? normalized.slice(5) : normalized;
}

function resolveActorLevel(roles: string[], permissions: string[]) {
  const normalizedRoles = roles.map(normalizeRoleName);
  if (normalizedRoles.includes("SUPER_ADMIN")) return ROLE_LEVELS.SUPER_ADMIN;
  if (normalizedRoles.includes("HOLDCO_ADMIN")) return ROLE_LEVELS.HOLDCO_ADMIN;
  if (normalizedRoles.includes("GROUP_ADMIN")) return ROLE_LEVELS.GROUP_ADMIN;
  if (permissions.includes("*")) return ROLE_LEVELS.GROUP_ADMIN;
  return 0;
}

function requiredLevelForRole(roleName: string) {
  const normalized = normalizeRoleName(roleName);
  return ROLE_LEVELS[normalized] ?? 0;
}

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async listRoles(groupId: string) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");

    const roles = await this.prisma.role.findMany({
      where: { groupId },
      include: { rolePermissions: { include: { permission: true } } },
      orderBy: { name: "asc" },
    });

    return roles.map((role: any) => ({
      id: role.id,
      name: role.name,
      scope: role.scope,
      permissions: role.rolePermissions.map((rp: any) => rp.permission.code),
    }));
  }

  async listPermissions() {
    const permissions = await this.prisma.permission.findMany({ orderBy: { code: "asc" } });
    return permissions.map((permission: any) => ({
      id: permission.id,
      code: permission.code,
      description: permission.description,
    }));
  }

  async createRole(params: {
    groupId: string;
    name: string;
    scope: string;
    permissions: string[];
    actorRoles?: string[];
    actorPermissions?: string[];
  }) {
    const { groupId, name, scope, permissions, actorRoles = [], actorPermissions = [] } = params;
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");

    this.assertRoleMutationAllowed(name, actorRoles, actorPermissions);

    const permissionIds = await this.ensurePermissions(permissions);

    if (permissions.includes("*") && resolveActorLevel(actorRoles, actorPermissions) < ROLE_LEVELS.SUPER_ADMIN) {
      throw new ForbiddenException("Only SUPER_ADMIN can assign wildcard permissions");
    }

    const role = await this.prisma.role.create({
      data: {
        groupId,
        name,
        scope,
        rolePermissions: {
          create: permissionIds.map((permissionId) => ({ permissionId })),
        },
      },
    });

    return this.getRole(role.id);
  }

  async setRolePermissions(params: {
    groupId: string;
    roleId: string;
    permissions: string[];
    actorRoles?: string[];
    actorPermissions?: string[];
  }) {
    const { groupId, roleId, permissions, actorRoles = [], actorPermissions = [] } = params;
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");

    const role = await this.prisma.role.findFirst({ where: { id: roleId, groupId } });
    if (!role) throw new NotFoundException("Role not found");

    this.assertRoleMutationAllowed(role.name, actorRoles, actorPermissions);

    if (permissions.includes("*") && resolveActorLevel(actorRoles, actorPermissions) < ROLE_LEVELS.SUPER_ADMIN) {
      throw new ForbiddenException("Only SUPER_ADMIN can assign wildcard permissions");
    }

    const permissionIds = await this.ensurePermissions(permissions);

    await this.prisma.rolePermission.deleteMany({ where: { roleId } });
    if (permissionIds.length) {
      await this.prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
      });
    }

    return this.getRole(roleId);
  }

  async assignUserRole(params: {
    groupId: string;
    userId: string;
    roleId: string;
    subsidiaryId?: string;
    locationId?: string;
    actorRoles?: string[];
    actorPermissions?: string[];
  }) {
    const { groupId, userId, roleId, subsidiaryId, locationId, actorRoles = [], actorPermissions = [] } = params;
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");

    const user = await this.prisma.user.findFirst({ where: { id: userId, groupId } });
    if (!user) throw new NotFoundException("User not found");

    const role = await this.prisma.role.findFirst({ where: { id: roleId, groupId } });
    if (!role) throw new NotFoundException("Role not found");

    this.assertRoleAssignmentAllowed(role.name, actorRoles, actorPermissions);

    if (subsidiaryId) {
      const subsidiary = await this.prisma.subsidiary.findFirst({ where: { id: subsidiaryId, groupId } });
      if (!subsidiary) throw new NotFoundException("Subsidiary not found");
    }

    if (locationId) {
      const location = await this.prisma.location.findFirst({ where: { id: locationId, groupId } });
      if (!location) throw new NotFoundException("Location not found");
      if (subsidiaryId && location.subsidiaryId !== subsidiaryId) {
        throw new BadRequestException("Location does not belong to subsidiary");
      }
    }

    const existing = await this.prisma.userRole.findFirst({
      where: {
        userId,
        roleId,
        subsidiaryId: subsidiaryId ?? null,
        locationId: locationId ?? null,
      },
    });

    if (existing) {
      return {
        id: existing.id,
        user_id: existing.userId,
        role_id: existing.roleId,
        subsidiary_id: existing.subsidiaryId,
        location_id: existing.locationId,
        created_at: existing.createdAt,
      };
    }

    const userRole = await this.prisma.userRole.create({
      data: {
        userId,
        roleId,
        subsidiaryId,
        locationId,
      },
    });

    return {
      id: userRole.id,
      user_id: userRole.userId,
      role_id: userRole.roleId,
      subsidiary_id: userRole.subsidiaryId,
      location_id: userRole.locationId,
      created_at: userRole.createdAt,
    };
  }

  private async getRole(roleId: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: { rolePermissions: { include: { permission: true } } },
    });
    if (!role) throw new NotFoundException("Role not found");

    return {
      id: role.id,
      name: role.name,
      scope: role.scope,
      permissions: role.rolePermissions.map((rp: any) => rp.permission.code),
    };
  }

  private assertRoleAssignmentAllowed(roleName: string, actorRoles: string[], actorPermissions: string[]) {
    const targetLevel = requiredLevelForRole(roleName);
    if (!targetLevel) return;

    const actorLevel = resolveActorLevel(actorRoles, actorPermissions);
    if (actorLevel < targetLevel) {
      throw new ForbiddenException(`Insufficient privileges to assign ${normalizeRoleName(roleName)}`);
    }
  }

  private assertRoleMutationAllowed(roleName: string, actorRoles: string[], actorPermissions: string[]) {
    const normalized = normalizeRoleName(roleName);
    if (!PRIVILEGED_ROLES.has(normalized)) return;

    const targetLevel = requiredLevelForRole(normalized);
    const actorLevel = resolveActorLevel(actorRoles, actorPermissions);
    if (actorLevel < targetLevel) {
      throw new ForbiddenException(`Insufficient privileges to manage ${normalized}`);
    }
  }

  private async ensurePermissions(codes: string[]) {
    const normalized = Array.from(
      new Set(
        codes
          .map((code) => code.trim())
          .filter((code) => code.length > 0),
      ),
    );

    if (!normalized.length) {
      return [];
    }

    const permissions = await Promise.all(
      normalized.map((code) =>
        this.prisma.permission.upsert({
          where: { code },
          update: {},
          create: { code },
        }),
      ),
    );

    return permissions.map((permission) => permission.id);
  }
}
