import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma, SubsidiaryRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateLocationDto } from "./dto/create-location.dto";
import { CreateSubsidiaryDto } from "./dto/create-subsidiary.dto";
import { ListLocationsDto } from "./dto/list-locations.dto";

const DEFAULT_LOCATIONS: Record<SubsidiaryRole, { type: string; name: string } | null> = {
  [SubsidiaryRole.HOLDCO]: null,
  [SubsidiaryRole.PROCUREMENT_TRADING]: { type: "warehouse", name: "Central Warehouse" },
  [SubsidiaryRole.RETAIL]: { type: "retail_store", name: "Retail Main" },
  [SubsidiaryRole.RESELLER]: { type: "reseller_hub", name: "Reseller Hub" },
  [SubsidiaryRole.DIGITAL_COMMERCE]: { type: "fulfillment_center", name: "Fulfillment Center" },
  [SubsidiaryRole.LOGISTICS]: { type: "distribution_center", name: "Distribution Center" },
};

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

  async createSubsidiary(groupId: string, body: CreateSubsidiaryDto) {
    if (!groupId) {
      throw new BadRequestException("Group id is required");
    }

    const group = await this.prisma.tenantGroup.findFirst({ where: { id: groupId } });
    if (!group) {
      throw new BadRequestException("Group not found");
    }

    const name = body.name.trim();
    const status = body.status?.trim() || "active";
    const createDefault = body.create_default_location !== false;
    const defaultLocation = createDefault ? DEFAULT_LOCATIONS[body.role] : null;
    const locationName = body.location?.name?.trim() || defaultLocation?.name;
    const locationType = body.location?.type?.trim() || defaultLocation?.type;

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.subsidiary.findFirst({
        where: { groupId, name },
      });

      const subsidiary = existing
        ? await tx.subsidiary.update({
            where: { id: existing.id },
            data: { role: body.role, status },
          })
        : await tx.subsidiary.create({
            data: {
              groupId,
              name,
              role: body.role,
              status,
            },
          });

      let location;
      if (locationName || locationType) {
        if (!locationName || !locationType) {
          throw new BadRequestException("Location name and type are required");
        }

        const existingLocation = await tx.location.findFirst({
          where: { groupId, subsidiaryId: subsidiary.id, name: locationName, type: locationType },
        });

        location =
          existingLocation ??
          (await tx.location.create({
            data: {
              groupId,
              subsidiaryId: subsidiary.id,
              name: locationName,
              type: locationType,
              addressLine1: body.location?.address_line1?.trim() || undefined,
              addressLine2: body.location?.address_line2?.trim() || undefined,
              city: body.location?.city?.trim() || undefined,
              state: body.location?.state?.trim() || undefined,
              country: body.location?.country?.trim() || undefined,
            },
          }));
      }

      return {
        subsidiary: {
          id: subsidiary.id,
          name: subsidiary.name,
          role: subsidiary.role ?? undefined,
          status: subsidiary.status,
        },
        location: location
          ? {
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
            }
          : undefined,
      };
    });
  }

  async createLocation(groupId: string, body: CreateLocationDto) {
    if (!groupId) {
      throw new BadRequestException("Group id is required");
    }

    const subsidiary = await this.prisma.subsidiary.findFirst({
      where: { id: body.subsidiary_id, groupId },
    });
    if (!subsidiary) {
      throw new BadRequestException("Subsidiary not found");
    }

    const name = body.name.trim();
    const type = body.type.trim();

    const existing = await this.prisma.location.findFirst({
      where: { groupId, subsidiaryId: subsidiary.id, name, type },
    });

    const location =
      existing ??
      (await this.prisma.location.create({
        data: {
          groupId,
          subsidiaryId: subsidiary.id,
          name,
          type,
          addressLine1: body.address_line1?.trim() || undefined,
          addressLine2: body.address_line2?.trim() || undefined,
          city: body.city?.trim() || undefined,
          state: body.state?.trim() || undefined,
          country: body.country?.trim() || undefined,
        },
      }));

    return {
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
    };
  }
}
