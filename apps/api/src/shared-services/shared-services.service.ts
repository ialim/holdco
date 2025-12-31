import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { CreateServiceRequestDto } from "./dto/create-service-request.dto";
import { CreateThirdPartyDto } from "./dto/create-third-party.dto";
import { UpdateThirdPartyDto } from "./dto/update-third-party.dto";
import { ListQueryDto } from "./dto/list-query.dto";
import { ServiceRequestActionDto } from "./dto/service-request-action.dto";
import { ServiceRequestAssignDto } from "./dto/service-request-assign.dto";
import { ServiceRequestCategory, ServiceRequestPriority, ServiceRequestStatus, ThirdPartyStatus } from "./enums/shared-services.enums";
import { PrismaService } from "../prisma/prisma.service";

const APPROVAL_REQUIRED_CATEGORIES = new Set<ServiceRequestCategory>([
  ServiceRequestCategory.FINANCIAL,
  ServiceRequestCategory.ACCOUNTING,
  ServiceRequestCategory.AUDITING,
  ServiceRequestCategory.COMPLIANCE,
  ServiceRequestCategory.RISK_MANAGEMENT,
  ServiceRequestCategory.PROCUREMENT,
]);

@Injectable()
export class SharedServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async listThirdParties(groupId: string, query: ListQueryDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");

    const where = { groupId };

    const [total, thirdParties] = await this.prisma.$transaction([
      this.prisma.externalClient.count({ where }),
      this.prisma.externalClient.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: query.offset ?? 0,
        take: query.limit ?? 50,
      }),
    ]);

    return {
      data: thirdParties.map((party) => this.mapThirdParty(party)),
      meta: this.buildMeta(query, total),
    };
  }

  async createThirdParty(groupId: string, body: CreateThirdPartyDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");

    const thirdParty = await this.prisma.externalClient.create({
      data: {
        groupId,
        name: body.name,
        type: body.type,
        email: body.email,
        phone: body.phone,
        creditLimit: body.credit_limit,
        creditCurrency: body.credit_currency,
        paymentTermDays: body.payment_term_days,
        negotiationNotes: body.negotiation_notes,
        lastNegotiatedAt: body.last_negotiated_at ? new Date(body.last_negotiated_at) : undefined,
        lastNegotiatedBy: body.last_negotiated_by,
        status: ThirdPartyStatus.ACTIVE,
      },
    });

    return this.mapThirdParty(thirdParty);
  }

  async updateThirdParty(groupId: string, thirdPartyId: string, body: UpdateThirdPartyDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");

    const existing = await this.prisma.externalClient.findFirst({
      where: { id: thirdPartyId, groupId },
    });
    if (!existing) throw new NotFoundException("Third-party not found");

    const data: Prisma.ExternalClientUpdateInput = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.type !== undefined) data.type = body.type;
    if (body.email !== undefined) data.email = body.email;
    if (body.phone !== undefined) data.phone = body.phone;
    if (body.credit_limit !== undefined) data.creditLimit = body.credit_limit;
    if (body.credit_currency !== undefined) data.creditCurrency = body.credit_currency;
    if (body.payment_term_days !== undefined) data.paymentTermDays = body.payment_term_days;
    if (body.negotiation_notes !== undefined) data.negotiationNotes = body.negotiation_notes;
    if (body.last_negotiated_at !== undefined) {
      data.lastNegotiatedAt = body.last_negotiated_at ? new Date(body.last_negotiated_at) : null;
    }
    if (body.last_negotiated_by !== undefined) data.lastNegotiatedBy = body.last_negotiated_by;
    if (body.status !== undefined) data.status = body.status;

    const updated = await this.prisma.externalClient.update({
      where: { id: existing.id },
      data,
    });

    return this.mapThirdParty(updated);
  }

  async listServiceRequests(groupId: string, subsidiaryId: string, query: ListQueryDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const where = { groupId, subsidiaryId };

    const [total, requests] = await this.prisma.$transaction([
      this.prisma.serviceRequest.count({ where }),
      this.prisma.serviceRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: query.offset ?? 0,
        take: query.limit ?? 50,
      }),
    ]);

    return {
      data: requests.map((request) => this.mapServiceRequest(request)),
      meta: this.buildMeta(query, total),
    };
  }

  async createServiceRequest(groupId: string, subsidiaryId: string, body: CreateServiceRequestDto, actorId?: string) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");
    if (body.subsidiary_id && body.subsidiary_id !== subsidiaryId) {
      throw new BadRequestException("Subsidiary header does not match request body");
    }

    const request = await this.prisma.serviceRequest.create({
      data: {
        groupId,
        subsidiaryId,
        externalClientId: body.external_client_id,
        category: body.category,
        title: body.title,
        description: body.description,
        status: ServiceRequestStatus.OPEN,
        priority: body.priority ?? ServiceRequestPriority.NORMAL,
        assignedToId: body.assigned_to,
        dueAt: body.due_at ? new Date(body.due_at) : undefined,
      },
    });

    await this.recordAudit({
      groupId,
      subsidiaryId,
      actorId,
      action: "service_request.create",
      entityId: request.id,
      payload: {
        category: request.category,
        priority: request.priority,
      },
    });

    return this.mapServiceRequest(request);
  }

  async getServiceRequest(groupId: string, subsidiaryId: string, serviceRequestId: string) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const request = await this.prisma.serviceRequest.findFirst({
      where: { id: serviceRequestId, groupId, subsidiaryId },
    });
    if (!request) throw new NotFoundException("Service request not found");

    return this.mapServiceRequest(request);
  }

  async approveServiceRequest(
    groupId: string,
    subsidiaryId: string,
    serviceRequestId: string,
    body: ServiceRequestActionDto,
    actorId?: string,
  ) {
    const request = await this.getRequestForUpdate(groupId, subsidiaryId, serviceRequestId);
    if (request.status !== ServiceRequestStatus.OPEN) {
      throw new ConflictException("Service request cannot be approved from the current status");
    }

    await this.assertNotSelfApproval(request.id, groupId, subsidiaryId, actorId);

    const updated = await this.prisma.serviceRequest.update({
      where: { id: request.id },
      data: {
        status: ServiceRequestStatus.APPROVED,
        approvedById: actorId,
        approvedAt: new Date(),
        rejectedById: null,
        rejectedAt: null,
        reason: body.reason,
      },
    });

    await this.recordAudit({
      groupId,
      subsidiaryId,
      actorId,
      action: "service_request.approve",
      entityId: updated.id,
      payload: { reason: body.reason, comment: body.comment },
    });

    return this.mapServiceRequest(updated);
  }

  async rejectServiceRequest(
    groupId: string,
    subsidiaryId: string,
    serviceRequestId: string,
    body: ServiceRequestActionDto,
    actorId?: string,
  ) {
    const request = await this.getRequestForUpdate(groupId, subsidiaryId, serviceRequestId);
    if (request.status !== ServiceRequestStatus.OPEN) {
      throw new ConflictException("Service request cannot be rejected from the current status");
    }

    await this.assertNotSelfApproval(request.id, groupId, subsidiaryId, actorId);

    const updated = await this.prisma.serviceRequest.update({
      where: { id: request.id },
      data: {
        status: ServiceRequestStatus.REJECTED,
        rejectedById: actorId,
        rejectedAt: new Date(),
        approvedById: null,
        approvedAt: null,
        reason: body.reason,
      },
    });

    await this.recordAudit({
      groupId,
      subsidiaryId,
      actorId,
      action: "service_request.reject",
      entityId: updated.id,
      payload: { reason: body.reason, comment: body.comment },
    });

    return this.mapServiceRequest(updated);
  }

  async assignServiceRequest(
    groupId: string,
    subsidiaryId: string,
    serviceRequestId: string,
    body: ServiceRequestAssignDto,
    actorId?: string,
  ) {
    const request = await this.getRequestForUpdate(groupId, subsidiaryId, serviceRequestId);
    const status = request.status as ServiceRequestStatus;
    if ([ServiceRequestStatus.CANCELLED, ServiceRequestStatus.COMPLETED, ServiceRequestStatus.REJECTED].includes(status)) {
      throw new ConflictException("Service request cannot be assigned in the current status");
    }

    const updated = await this.prisma.serviceRequest.update({
      where: { id: request.id },
      data: {
        assignedToId: body.assigned_to,
        dueAt: body.due_at ? new Date(body.due_at) : undefined,
        priority: body.priority ?? request.priority,
      },
    });

    await this.recordAudit({
      groupId,
      subsidiaryId,
      actorId,
      action: "service_request.assign",
      entityId: updated.id,
      payload: {
        assigned_to: body.assigned_to,
        due_at: body.due_at,
        priority: body.priority ?? request.priority,
      },
    });

    return this.mapServiceRequest(updated);
  }

  async startServiceRequest(
    groupId: string,
    subsidiaryId: string,
    serviceRequestId: string,
    body: ServiceRequestActionDto,
    actorId?: string,
  ) {
    const request = await this.getRequestForUpdate(groupId, subsidiaryId, serviceRequestId);

    const requiresApproval = APPROVAL_REQUIRED_CATEGORIES.has(request.category as ServiceRequestCategory);
    if (request.status === ServiceRequestStatus.OPEN && requiresApproval) {
      throw new ConflictException("Approval is required before starting this request");
    }

    const status = request.status as ServiceRequestStatus;
    if (![ServiceRequestStatus.OPEN, ServiceRequestStatus.APPROVED, ServiceRequestStatus.ON_HOLD].includes(status)) {
      throw new ConflictException("Service request cannot be started from the current status");
    }

    const updated = await this.prisma.serviceRequest.update({
      where: { id: request.id },
      data: {
        status: ServiceRequestStatus.IN_PROGRESS,
        reason: body.reason,
      },
    });

    await this.recordAudit({
      groupId,
      subsidiaryId,
      actorId,
      action: "service_request.start",
      entityId: updated.id,
      payload: { reason: body.reason, comment: body.comment },
    });

    return this.mapServiceRequest(updated);
  }

  async completeServiceRequest(
    groupId: string,
    subsidiaryId: string,
    serviceRequestId: string,
    body: ServiceRequestActionDto,
    actorId?: string,
  ) {
    const request = await this.getRequestForUpdate(groupId, subsidiaryId, serviceRequestId);
    if (request.status !== ServiceRequestStatus.IN_PROGRESS) {
      throw new ConflictException("Service request cannot be completed from the current status");
    }

    const updated = await this.prisma.serviceRequest.update({
      where: { id: request.id },
      data: {
        status: ServiceRequestStatus.COMPLETED,
        reason: body.reason,
      },
    });

    await this.recordAudit({
      groupId,
      subsidiaryId,
      actorId,
      action: "service_request.complete",
      entityId: updated.id,
      payload: { reason: body.reason, comment: body.comment },
    });

    return this.mapServiceRequest(updated);
  }

  async cancelServiceRequest(
    groupId: string,
    subsidiaryId: string,
    serviceRequestId: string,
    body: ServiceRequestActionDto,
    actorId?: string,
  ) {
    const request = await this.getRequestForUpdate(groupId, subsidiaryId, serviceRequestId);
    const status = request.status as ServiceRequestStatus;
    if (![ServiceRequestStatus.OPEN, ServiceRequestStatus.APPROVED, ServiceRequestStatus.IN_PROGRESS, ServiceRequestStatus.ON_HOLD].includes(status)) {
      throw new ConflictException("Service request cannot be cancelled from the current status");
    }

    const updated = await this.prisma.serviceRequest.update({
      where: { id: request.id },
      data: {
        status: ServiceRequestStatus.CANCELLED,
        reason: body.reason,
      },
    });

    await this.recordAudit({
      groupId,
      subsidiaryId,
      actorId,
      action: "service_request.cancel",
      entityId: updated.id,
      payload: { reason: body.reason, comment: body.comment },
    });

    return this.mapServiceRequest(updated);
  }

  private async getRequestForUpdate(groupId: string, subsidiaryId: string, serviceRequestId: string) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const request = await this.prisma.serviceRequest.findFirst({
      where: { id: serviceRequestId, groupId, subsidiaryId },
    });
    if (!request) throw new NotFoundException("Service request not found");
    return request;
  }

  private async assertNotSelfApproval(
    serviceRequestId: string,
    groupId: string,
    subsidiaryId: string,
    actorId?: string,
  ) {
    if (!actorId) return;
    const createdLog = await this.prisma.auditLog.findFirst({
      where: {
        entityType: "service_request",
        entityId: serviceRequestId,
        action: "service_request.create",
        groupId,
        subsidiaryId,
      },
      orderBy: { createdAt: "asc" },
    });
    if (createdLog?.actorId && createdLog.actorId === actorId) {
      throw new ConflictException("Requesters cannot approve or reject their own requests");
    }
  }

  private async recordAudit(params: {
    groupId: string;
    subsidiaryId?: string;
    actorId?: string;
    action: string;
    entityId: string;
    payload?: Record<string, unknown>;
  }) {
    const payload = params.payload ? (JSON.parse(JSON.stringify(params.payload)) as Prisma.InputJsonValue) : undefined;
    await this.prisma.auditLog.create({
      data: {
        groupId: params.groupId,
        subsidiaryId: params.subsidiaryId,
        actorId: params.actorId,
        action: params.action,
        entityType: "service_request",
        entityId: params.entityId,
        payload,
      },
    });
  }

  private mapThirdParty(party: {
    id: string;
    name: string;
    type: string;
    email: string | null;
    phone: string | null;
    status: string;
    creditLimit: Prisma.Decimal | null;
    creditCurrency: string | null;
    paymentTermDays: number | null;
    negotiationNotes: string | null;
    lastNegotiatedAt: Date | null;
    lastNegotiatedBy: string | null;
  }) {
    return {
      id: party.id,
      name: party.name,
      type: party.type,
      email: party.email ?? undefined,
      phone: party.phone ?? undefined,
      credit_limit: party.creditLimit !== null ? Number(party.creditLimit) : undefined,
      credit_currency: party.creditCurrency ?? undefined,
      payment_term_days: party.paymentTermDays ?? undefined,
      negotiation_notes: party.negotiationNotes ?? undefined,
      last_negotiated_at: party.lastNegotiatedAt ? party.lastNegotiatedAt.toISOString() : undefined,
      last_negotiated_by: party.lastNegotiatedBy ?? undefined,
      status: party.status,
    };
  }

  private mapServiceRequest(request: {
    id: string;
    subsidiaryId: string | null;
    externalClientId: string | null;
    category: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    assignedToId: string | null;
    approvedById: string | null;
    approvedAt: Date | null;
    rejectedById: string | null;
    rejectedAt: Date | null;
    reason: string | null;
    dueAt: Date | null;
  }) {
    return {
      id: request.id,
      subsidiary_id: request.subsidiaryId ?? undefined,
      external_client_id: request.externalClientId ?? undefined,
      category: request.category,
      title: request.title,
      description: request.description ?? undefined,
      status: request.status,
      priority: request.priority,
      assigned_to: request.assignedToId ?? undefined,
      approved_by: request.approvedById ?? undefined,
      approved_at: request.approvedAt ? request.approvedAt.toISOString() : undefined,
      rejected_by: request.rejectedById ?? undefined,
      rejected_at: request.rejectedAt ? request.rejectedAt.toISOString() : undefined,
      reason: request.reason ?? undefined,
      due_at: request.dueAt ? request.dueAt.toISOString() : undefined,
    };
  }

  private buildMeta(query: ListQueryDto, total: number) {
    return {
      limit: query.limit ?? 50,
      offset: query.offset ?? 0,
      total,
    };
  }
}
