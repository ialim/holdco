import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
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
}
