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
exports.AdvisoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AdvisoryService = class AdvisoryService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listEngagements(groupId, subsidiaryId, query) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
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
            data: engagements.map((engagement) => ({
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
    async createEngagement(groupId, subsidiaryId, body) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
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
    async listDeliverables(groupId, subsidiaryId, query) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
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
            data: deliverables.map((deliverable) => ({
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
    async createDeliverable(groupId, subsidiaryId, body) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
        const engagement = await this.prisma.advisoryEngagement.findFirst({
            where: { id: body.advisory_engagement_id, groupId, subsidiaryId },
        });
        if (!engagement)
            throw new common_1.NotFoundException("Advisory engagement not found");
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
exports.AdvisoryService = AdvisoryService;
exports.AdvisoryService = AdvisoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdvisoryService);
//# sourceMappingURL=advisory.service.js.map