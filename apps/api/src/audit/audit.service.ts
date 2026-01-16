import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { ListAuditLogLookupDto } from "./dto/list-audit-log-lookup.dto";
import { ListAuditLogsDto } from "./dto/list-audit-logs.dto";

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  private isUuid(value?: string) {
    if (!value) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  private async resolveActorId(actorId?: string) {
    if (!this.isUuid(actorId)) return undefined;
    const exists = await this.prisma.user.findUnique({ where: { id: actorId }, select: { id: true } });
    return exists ? actorId : undefined;
  }

  async record(params: {
    groupId: string;
    subsidiaryId?: string;
    actorId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    payload?: Record<string, unknown>;
  }) {
    const actorId = await this.resolveActorId(params.actorId);
    const payload = params.payload
      ? (JSON.parse(JSON.stringify(params.payload)) as Prisma.InputJsonValue)
      : undefined;

    await this.prisma.auditLog.create({
      data: {
        groupId: params.groupId,
        subsidiaryId: params.subsidiaryId,
        actorId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        payload,
      },
    });
  }

  async listAuditLogs(groupId: string, query: ListAuditLogsDto) {
    if (!groupId) {
      throw new BadRequestException("X-Group-Id header is required");
    }

    const createdAt: { gte?: Date; lte?: Date } = {};
    if (query.start_date) {
      createdAt.gte = new Date(query.start_date);
    }
    if (query.end_date) {
      const end = new Date(query.end_date);
      end.setHours(23, 59, 59, 999);
      createdAt.lte = end;
    }

    const where: Prisma.AuditLogWhereInput = {
      groupId,
      ...(query.subsidiary_id ? { subsidiaryId: query.subsidiary_id } : {}),
      ...(query.actor_id ? { actorId: query.actor_id } : {}),
      ...(query.actor_email
        ? { actor: { email: { contains: query.actor_email, mode: "insensitive" as const } } }
        : {}),
      ...(query.entity_id ? { entityId: query.entity_id } : {}),
      ...(query.entity_type ? { entityType: query.entity_type } : {}),
      ...(query.action ? { action: query.action } : {}),
      ...(createdAt.gte || createdAt.lte ? { createdAt } : {}),
    };

    const [total, logs] = await this.prisma.$transaction([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: query.offset ?? 0,
        take: query.limit ?? 50,
        include: { actor: true },
      }),
    ]);

    return {
      data: logs.map((log) => ({
        id: log.id,
        subsidiary_id: log.subsidiaryId ?? undefined,
        actor_id: log.actorId ?? undefined,
        actor: log.actor
          ? {
              id: log.actor.id,
              email: log.actor.email,
              name: log.actor.name ?? undefined,
            }
          : undefined,
        action: log.action,
        entity_type: log.entityType,
        entity_id: log.entityId ?? undefined,
        payload: log.payload ?? undefined,
        created_at: log.createdAt.toISOString(),
      })),
      meta: {
        limit: query.limit ?? 50,
        offset: query.offset ?? 0,
        total,
      },
    };
  }

  async listAuditActions(groupId: string, query: ListAuditLogLookupDto) {
    if (!groupId) {
      throw new BadRequestException("X-Group-Id header is required");
    }

    const limit = query.limit ?? 200;
    const offset = query.offset ?? 0;
    const where: Prisma.AuditLogWhereInput = {
      groupId,
      ...(query.q ? { action: { contains: query.q, mode: "insensitive" as const } } : {}),
    };

    const [allActions, actions] = await this.prisma.$transaction([
      this.prisma.auditLog.groupBy({ by: ["action"], where, orderBy: { action: "asc" } }),
      this.prisma.auditLog.groupBy({
        by: ["action"],
        where,
        orderBy: { action: "asc" },
        skip: offset,
        take: limit,
      }),
    ]);

    return {
      data: actions.map((row) => ({ value: row.action, label: row.action })),
      meta: {
        limit,
        offset,
        total: allActions.length,
      },
    };
  }

  async listAuditEntityTypes(groupId: string, query: ListAuditLogLookupDto) {
    if (!groupId) {
      throw new BadRequestException("X-Group-Id header is required");
    }

    const limit = query.limit ?? 200;
    const offset = query.offset ?? 0;
    const where: Prisma.AuditLogWhereInput = {
      groupId,
      ...(query.q ? { entityType: { contains: query.q, mode: "insensitive" as const } } : {}),
    };

    const [allTypes, types] = await this.prisma.$transaction([
      this.prisma.auditLog.groupBy({ by: ["entityType"], where, orderBy: { entityType: "asc" } }),
      this.prisma.auditLog.groupBy({
        by: ["entityType"],
        where,
        orderBy: { entityType: "asc" },
        skip: offset,
        take: limit,
      }),
    ]);

    return {
      data: types.map((row) => ({ value: row.entityType, label: row.entityType })),
      meta: {
        limit,
        offset,
        total: allTypes.length,
      },
    };
  }

  async listAuditActors(groupId: string, query: ListAuditLogLookupDto) {
    if (!groupId) {
      throw new BadRequestException("X-Group-Id header is required");
    }

    const limit = query.limit ?? 200;
    const offset = query.offset ?? 0;
    const where: Prisma.AuditLogWhereInput = {
      groupId,
      actorId: { not: null },
      ...(query.q
        ? {
            actor: {
              OR: [
                { email: { contains: query.q, mode: "insensitive" as const } },
                { name: { contains: query.q, mode: "insensitive" as const } },
              ],
            },
          }
        : {}),
    };

    const [allActors, rows] = await this.prisma.$transaction([
      this.prisma.auditLog.groupBy({ by: ["actorId"], where, orderBy: { actorId: "asc" } }),
      this.prisma.auditLog.groupBy({
        by: ["actorId"],
        where,
        orderBy: { actorId: "asc" },
        skip: offset,
        take: limit,
      }),
    ]);

    const actorIds = rows.map((row) => row.actorId).filter((id): id is string => Boolean(id));
    const actors = await this.prisma.user.findMany({
      where: { id: { in: actorIds } },
      select: { id: true, email: true, name: true },
    });
    const actorMap = new Map(actors.map((actor) => [actor.id, actor]));
    const data = actorIds
      .map((id) => actorMap.get(id))
      .filter((actor): actor is { id: string; email: string; name: string | null } => Boolean(actor))
      .map((actor) => ({
        id: actor.id,
        email: actor.email,
        name: actor.name ?? undefined,
      }));

    return {
      data,
      meta: {
        limit,
        offset,
        total: allActors.length,
      },
    };
  }
}
