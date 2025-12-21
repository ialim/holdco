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
exports.LoyaltyService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let LoyaltyService = class LoyaltyService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listCustomers(groupId, subsidiaryId, query) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
        const where = {
            groupId,
            subsidiaryId,
            ...(query.q
                ? {
                    name: {
                        contains: query.q,
                        mode: "insensitive",
                    },
                }
                : {}),
        };
        const [total, customers] = await this.prisma.$transaction([
            this.prisma.customer.count({ where }),
            this.prisma.customer.findMany({ where, orderBy: { name: "asc" }, skip: query.offset ?? 0, take: query.limit ?? 50 }),
        ]);
        return {
            data: customers.map((customer) => ({
                id: customer.id,
                name: customer.name,
                email: customer.email ?? undefined,
                phone: customer.phone ?? undefined,
            })),
            meta: this.buildMeta(query, total),
        };
    }
    async createCustomer(groupId, subsidiaryId, body) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
        const customer = await this.prisma.customer.create({
            data: {
                groupId,
                subsidiaryId,
                name: body.name,
                email: body.email,
                phone: body.phone,
            },
        });
        return {
            id: customer.id,
            name: customer.name,
            email: customer.email ?? undefined,
            phone: customer.phone ?? undefined,
        };
    }
    async listLoyaltyAccounts(groupId, subsidiaryId, query) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
        const where = {
            groupId,
            subsidiaryId,
        };
        const [total, accounts] = await this.prisma.$transaction([
            this.prisma.loyaltyAccount.count({ where }),
            this.prisma.loyaltyAccount.findMany({ where, orderBy: { createdAt: "desc" }, skip: query.offset ?? 0, take: query.limit ?? 50 }),
        ]);
        return {
            data: accounts.map((account) => ({
                id: account.id,
                customer_id: account.customerId,
                points_balance: account.pointsBalance,
            })),
            meta: this.buildMeta(query, total),
        };
    }
    async createLoyaltyAccount(groupId, subsidiaryId, body) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
        const account = await this.prisma.loyaltyAccount.create({
            data: {
                groupId,
                subsidiaryId,
                customerId: body.customer_id,
            },
        });
        return {
            id: account.id,
            customer_id: account.customerId,
            points_balance: account.pointsBalance,
        };
    }
    async issuePoints(groupId, subsidiaryId, body) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
        const account = await this.prisma.loyaltyAccount.findFirst({
            where: { customerId: body.customer_id, groupId, subsidiaryId },
        });
        if (!account)
            throw new common_1.NotFoundException("Loyalty account not found");
        const [updated] = await this.prisma.$transaction([
            this.prisma.loyaltyAccount.update({
                where: { id: account.id },
                data: { pointsBalance: { increment: body.points } },
            }),
            this.prisma.pointsLedger.create({
                data: {
                    groupId,
                    subsidiaryId,
                    loyaltyAccountId: account.id,
                    points: body.points,
                    reason: body.reason,
                },
            }),
        ]);
        return {
            id: updated.id,
            customer_id: updated.customerId,
            points_balance: updated.pointsBalance,
        };
    }
    buildMeta(query, total) {
        return {
            limit: query.limit ?? 50,
            offset: query.offset ?? 0,
            total,
        };
    }
};
exports.LoyaltyService = LoyaltyService;
exports.LoyaltyService = LoyaltyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LoyaltyService);
//# sourceMappingURL=loyalty.service.js.map