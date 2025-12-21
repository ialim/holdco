import { BadRequestException, Injectable } from "@nestjs/common";
import { ListQueryDto } from "../common/dto/list-query.dto";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCompliancePolicyDto } from "./dto/create-compliance-policy.dto";
import { CreateComplianceTaskDto } from "./dto/create-compliance-task.dto";
import { CreateRiskRegisterItemDto } from "./dto/create-risk-register.dto";
import { CreateComplianceAuditDto } from "./dto/create-compliance-audit.dto";

@Injectable()
export class ComplianceService {
  constructor(private readonly prisma: PrismaService) {}

  async listPolicies(groupId: string, subsidiaryId: string, query: ListQueryDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const where = {
      groupId,
      ...(query.status ? { status: query.status } : {}),
    };

    const [total, policies] = await this.prisma.$transaction([
      this.prisma.compliancePolicy.count({ where }),
      this.prisma.compliancePolicy.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: query.offset ?? 0,
        take: query.limit ?? 50,
      }),
    ]);

    return {
      data: policies.map((policy: any) => ({
        id: policy.id,
        title: policy.title,
        version: policy.version ?? undefined,
        status: policy.status,
        effective_at: this.formatDate(policy.effectiveAt),
        review_at: this.formatDate(policy.reviewAt),
        owner_id: policy.ownerId ?? undefined,
      })),
      meta: this.buildMeta(query, total),
    };
  }

  async createPolicy(groupId: string, subsidiaryId: string, body: CreateCompliancePolicyDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const policy = await this.prisma.compliancePolicy.create({
      data: {
        groupId,
        title: body.title,
        version: body.version,
        status: body.status,
        effectiveAt: body.effective_at ? new Date(body.effective_at) : undefined,
        reviewAt: body.review_at ? new Date(body.review_at) : undefined,
        ownerId: body.owner_id,
      },
    });

    return {
      id: policy.id,
      title: policy.title,
      version: policy.version ?? undefined,
      status: policy.status,
      effective_at: this.formatDate(policy.effectiveAt),
      review_at: this.formatDate(policy.reviewAt),
      owner_id: policy.ownerId ?? undefined,
    };
  }

  async listTasks(groupId: string, subsidiaryId: string, query: ListQueryDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const where = {
      groupId,
      subsidiaryId,
      ...(query.status ? { status: query.status } : {}),
    };

    const [total, tasks] = await this.prisma.$transaction([
      this.prisma.complianceTask.count({ where }),
      this.prisma.complianceTask.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: query.offset ?? 0,
        take: query.limit ?? 50,
      }),
    ]);

    return {
      data: tasks.map((task: any) => ({
        id: task.id,
        policy_id: task.policyId ?? undefined,
        title: task.title,
        status: task.status,
        due_at: task.dueAt ? task.dueAt.toISOString() : undefined,
        assignee_id: task.assigneeId ?? undefined,
      })),
      meta: this.buildMeta(query, total),
    };
  }

  async createTask(groupId: string, subsidiaryId: string, body: CreateComplianceTaskDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const task = await this.prisma.complianceTask.create({
      data: {
        groupId,
        subsidiaryId,
        policyId: body.policy_id,
        title: body.title,
        status: body.status,
        dueAt: body.due_at ? new Date(body.due_at) : undefined,
        assigneeId: body.assignee_id,
      },
    });

    return {
      id: task.id,
      policy_id: task.policyId ?? undefined,
      title: task.title,
      status: task.status,
      due_at: task.dueAt ? task.dueAt.toISOString() : undefined,
      assignee_id: task.assigneeId ?? undefined,
    };
  }

  async listRisks(groupId: string, subsidiaryId: string, query: ListQueryDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const where = {
      groupId,
      subsidiaryId,
      ...(query.status ? { status: query.status } : {}),
    };

    const [total, risks] = await this.prisma.$transaction([
      this.prisma.riskRegisterItem.count({ where }),
      this.prisma.riskRegisterItem.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: query.offset ?? 0,
        take: query.limit ?? 50,
      }),
    ]);

    return {
      data: risks.map((risk: any) => ({
        id: risk.id,
        title: risk.title,
        category: risk.category ?? undefined,
        likelihood: risk.likelihood ?? undefined,
        impact: risk.impact ?? undefined,
        score: risk.score ?? undefined,
        status: risk.status,
        owner_id: risk.ownerId ?? undefined,
        mitigation: risk.mitigation ?? undefined,
      })),
      meta: this.buildMeta(query, total),
    };
  }

  async createRisk(groupId: string, subsidiaryId: string, body: CreateRiskRegisterItemDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const risk = await this.prisma.riskRegisterItem.create({
      data: {
        groupId,
        subsidiaryId,
        title: body.title,
        category: body.category,
        likelihood: body.likelihood,
        impact: body.impact,
        score: body.score,
        status: body.status,
        ownerId: body.owner_id,
        mitigation: body.mitigation,
      },
    });

    return {
      id: risk.id,
      title: risk.title,
      category: risk.category ?? undefined,
      likelihood: risk.likelihood ?? undefined,
      impact: risk.impact ?? undefined,
      score: risk.score ?? undefined,
      status: risk.status,
      owner_id: risk.ownerId ?? undefined,
      mitigation: risk.mitigation ?? undefined,
    };
  }

  async listAudits(groupId: string, subsidiaryId: string, query: ListQueryDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const where = {
      groupId,
      subsidiaryId,
      ...(query.status ? { status: query.status } : {}),
    };

    const [total, audits] = await this.prisma.$transaction([
      this.prisma.complianceAudit.count({ where }),
      this.prisma.complianceAudit.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: query.offset ?? 0,
        take: query.limit ?? 50,
      }),
    ]);

    return {
      data: audits.map((audit: any) => ({
        id: audit.id,
        title: audit.title,
        scope: audit.scope ?? undefined,
        status: audit.status,
        started_at: this.formatDate(audit.startedAt),
        completed_at: this.formatDate(audit.completedAt),
        lead_auditor_id: audit.leadAuditorId ?? undefined,
      })),
      meta: this.buildMeta(query, total),
    };
  }

  async createAudit(groupId: string, subsidiaryId: string, body: CreateComplianceAuditDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const audit = await this.prisma.complianceAudit.create({
      data: {
        groupId,
        subsidiaryId,
        title: body.title,
        scope: body.scope,
        status: body.status,
        startedAt: body.started_at ? new Date(body.started_at) : undefined,
        completedAt: body.completed_at ? new Date(body.completed_at) : undefined,
        leadAuditorId: body.lead_auditor_id,
      },
    });

    return {
      id: audit.id,
      title: audit.title,
      scope: audit.scope ?? undefined,
      status: audit.status,
      started_at: this.formatDate(audit.startedAt),
      completed_at: this.formatDate(audit.completedAt),
      lead_auditor_id: audit.leadAuditorId ?? undefined,
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
