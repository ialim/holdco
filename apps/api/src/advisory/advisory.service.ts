import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ListQueryDto } from "../common/dto/list-query.dto";
import { PrismaService } from "../prisma/prisma.service";
import { CreateAdvisoryEngagementDto } from "./dto/create-advisory-engagement.dto";
import { CreateAdvisoryDeliverableDto } from "./dto/create-advisory-deliverable.dto";

@Injectable()
export class AdvisoryService {
  constructor(private readonly prisma: PrismaService) {}

  async listEngagements(groupId: string, subsidiaryId: string, query: ListQueryDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const where = {
      groupId,
      subsidiaryId,
      ...(query.status ? { status: query.status } : {}),
    };

    const [total, engagements] = await this.prisma.$transaction([
      this.prisma.advisoryEngagement.count({ where }),
      this.prisma.advisoryEngagement.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: query.offset ?? 0,
        take: query.limit ?? 50,
      }),
    ]);

    return {
      data: engagements.map((engagement: any) => ({
        id: engagement.id,
        external_client_id: engagement.externalClientId ?? undefined,
        title: engagement.title,
        scope: engagement.scope ?? undefined,
        status: engagement.status,
        start_at: this.formatDate(engagement.startAt),
        end_at: this.formatDate(engagement.endAt),
        lead_id: engagement.leadId ?? undefined,
      })),
      meta: this.buildMeta(query, total),
    };
  }

  async createEngagement(groupId: string, subsidiaryId: string, body: CreateAdvisoryEngagementDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const engagement = await this.prisma.advisoryEngagement.create({
      data: {
        groupId,
        subsidiaryId,
        externalClientId: body.external_client_id,
        title: body.title,
        scope: body.scope,
        status: body.status,
        startAt: body.start_at ? new Date(body.start_at) : undefined,
        endAt: body.end_at ? new Date(body.end_at) : undefined,
        leadId: body.lead_id,
      },
    });

    return {
      id: engagement.id,
      external_client_id: engagement.externalClientId ?? undefined,
      title: engagement.title,
      scope: engagement.scope ?? undefined,
      status: engagement.status,
      start_at: this.formatDate(engagement.startAt),
      end_at: this.formatDate(engagement.endAt),
      lead_id: engagement.leadId ?? undefined,
    };
  }

  async listDeliverables(groupId: string, subsidiaryId: string, query: ListQueryDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const where = {
      advisoryEngagement: {
        groupId,
        subsidiaryId,
      },
      ...(query.status ? { status: query.status } : {}),
    };

    const [total, deliverables] = await this.prisma.$transaction([
      this.prisma.advisoryDeliverable.count({ where }),
      this.prisma.advisoryDeliverable.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: query.offset ?? 0,
        take: query.limit ?? 50,
      }),
    ]);

    return {
      data: deliverables.map((deliverable: any) => ({
        id: deliverable.id,
        advisory_engagement_id: deliverable.advisoryEngagementId,
        title: deliverable.title,
        status: deliverable.status,
        due_at: this.formatDate(deliverable.dueAt),
        delivered_at: this.formatDate(deliverable.deliveredAt),
      })),
      meta: this.buildMeta(query, total),
    };
  }

  async createDeliverable(groupId: string, subsidiaryId: string, body: CreateAdvisoryDeliverableDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const engagement = await this.prisma.advisoryEngagement.findFirst({
      where: { id: body.advisory_engagement_id, groupId, subsidiaryId },
    });

    if (!engagement) throw new NotFoundException("Advisory engagement not found");

    const deliverable = await this.prisma.advisoryDeliverable.create({
      data: {
        advisoryEngagementId: body.advisory_engagement_id,
        title: body.title,
        status: body.status,
        dueAt: body.due_at ? new Date(body.due_at) : undefined,
        deliveredAt: body.delivered_at ? new Date(body.delivered_at) : undefined,
      },
    });

    return {
      id: deliverable.id,
      advisory_engagement_id: deliverable.advisoryEngagementId,
      title: deliverable.title,
      status: deliverable.status,
      due_at: this.formatDate(deliverable.dueAt),
      delivered_at: this.formatDate(deliverable.deliveredAt),
    };
  }

  private buildMeta(query: ListQueryDto, total: number) {
    return {
      limit: query.limit ?? 50,
      offset: query.offset ?? 0,
      total,
    };
  }

  private formatDate(value: Date | null) {
    return value ? value.toISOString().slice(0, 10) : undefined;
  }
}
