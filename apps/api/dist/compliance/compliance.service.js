"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplianceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ComplianceService = class ComplianceService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listPolicies(groupId, subsidiaryId, query) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
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
            data: policies.map((policy) => ({
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
    async createPolicy(groupId, subsidiaryId, body) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
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
    async listTasks(groupId, subsidiaryId, query) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
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
            data: tasks.map((task) => ({
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
    async createTask(groupId, subsidiaryId, body) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
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
    async listRisks(groupId, subsidiaryId, query) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
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
            data: risks.map((risk) => ({
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
    async createRisk(groupId, subsidiaryId, body) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
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
    async listAudits(groupId, subsidiaryId, query) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
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
            data: audits.map((audit) => ({
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
    async createAudit(groupId, subsidiaryId, body) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
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
    buildMeta(query, total) {
        return {
            limit: query.limit ?? 50,
            offset: query.offset ?? 0,
            total,
        };
    }
    formatDate(value) {
        return value ? value.toISOString().slice(0, 10) : undefined;
    }
};
exports.ComplianceService = ComplianceService;
exports.ComplianceService = ComplianceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ComplianceService);
//# sourceMappingURL=compliance.service.js.map