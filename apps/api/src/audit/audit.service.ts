import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  private isUuid(value?: string) {
    if (!value) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
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
    const actorId = this.isUuid(params.actorId) ? params.actorId : undefined;
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
}
