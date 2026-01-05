import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { ListLocationsDto } from "./dto/list-locations.dto";

@Injectable()
export class TenancyService {
  constructor(private readonly prisma: PrismaService) {}

  async listTenants(groupId?: string) {
    if (!groupId) {
      throw new BadRequestException("Group id is required");
    }

    const subsidiaries = await this.prisma.subsidiary.findMany({
      where: { groupId },
      orderBy: { name: "asc" },
    });

    return subsidiaries.map((subsidiary: any) => ({
      id: subsidiary.id,
      name: subsidiary.name,
      status: subsidiary.status,
    }));
  }

  async listUsers(params: { groupId: string; subsidiaryId: string; limit: number; offset: number }) {
    const { groupId, subsidiaryId, limit, offset } = params;

    const where = {
      groupId,
      userRoles: {
        some: {
          subsidiaryId,
        },
      },
    };

    const [total, users] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: { email: "asc" },
        skip: offset,
        take: limit,
        include: {
          userRoles: {
            include: {
              role: {
                include: {
                  rolePermissions: {
                    include: { permission: true },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    const data = users.map((user: any) => {
      const roles = user.userRoles.map((userRole: any) => userRole.role.name);
      const permissions = new Set<string>();
      for (const userRole of user.userRoles) {
        for (const rolePermission of userRole.role.rolePermissions) {
          permissions.add(rolePermission.permission.code);
        }
      }
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        roles,
        permissions: Array.from(permissions),
      };
    });

    return {
      data,
      meta: {
        limit,
        offset,
        total,
      },
    };
  }

  async listLocations(groupId: string, query: ListLocationsDto) {
    if (!groupId) {
      throw new BadRequestException("Group id is required");
    }

    const where: Prisma.LocationWhereInput = {
      groupId,
      ...(query.subsidiary_id ? { subsidiaryId: query.subsidiary_id } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: "insensitive" as const } },
              { city: { contains: query.q, mode: "insensitive" as const } },
              { state: { contains: query.q, mode: "insensitive" as const } },
              { country: { contains: query.q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [total, locations] = await this.prisma.$transaction([
      this.prisma.location.count({ where }),
      this.prisma.location.findMany({
        where,
        orderBy: { name: "asc" },
        skip: query.offset ?? 0,
        take: query.limit ?? 50,
      }),
    ]);

    return {
      data: locations.map((location) => ({
        id: location.id,
        group_id: location.groupId,
        subsidiary_id: location.subsidiaryId,
        type: location.type,
        name: location.name,
        address_line1: location.addressLine1 ?? undefined,
        address_line2: location.addressLine2 ?? undefined,
        city: location.city ?? undefined,
        state: location.state ?? undefined,
        country: location.country ?? undefined,
        created_at: location.createdAt.toISOString(),
        updated_at: location.updatedAt.toISOString(),
      })),
      meta: {
        limit: query.limit ?? 50,
        offset: query.offset ?? 0,
        total,
      },
    };
  }
}
