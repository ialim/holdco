import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

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

  async createRole(params: { groupId: string; name: string; scope: string; permissions: string[] }) {
    const { groupId, name, scope, permissions } = params;
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");

    const permissionIds = await this.ensurePermissions(permissions);

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

  async setRolePermissions(params: { groupId: string; roleId: string; permissions: string[] }) {
    const { groupId, roleId, permissions } = params;
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");

    const role = await this.prisma.role.findFirst({ where: { id: roleId, groupId } });
    if (!role) throw new NotFoundException("Role not found");

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
  }) {
    const { groupId, userId, roleId, subsidiaryId, locationId } = params;
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");

    const user = await this.prisma.user.findFirst({ where: { id: userId, groupId } });
    if (!user) throw new NotFoundException("User not found");

    const role = await this.prisma.role.findFirst({ where: { id: roleId, groupId } });
    if (!role) throw new NotFoundException("Role not found");

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
