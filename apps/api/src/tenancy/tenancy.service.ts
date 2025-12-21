import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

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
}
