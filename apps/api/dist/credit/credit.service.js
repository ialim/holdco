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
exports.CreditService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CreditService = class CreditService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listResellers(groupId, subsidiaryId, query) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
        const where = {
            groupId,
            subsidiaryId,
            ...(query.status ? { status: query.status } : {}),
            ...(query.q
                ? {
                    name: {
                        contains: query.q,
                        mode: "insensitive",
                    },
                }
                : {}),
        };
        const [total, resellers] = await this.prisma.$transaction([
            this.prisma.reseller.count({ where }),
            this.prisma.reseller.findMany({ where, orderBy: { name: "asc" }, skip: query.offset ?? 0, take: query.limit ?? 50 }),
        ]);
        return {
            data: resellers.map((reseller) => ({
                id: reseller.id,
                name: reseller.name,
                status: reseller.status,
            })),
            meta: this.buildMeta(query, total),
        };
    }
    async createReseller(groupId, subsidiaryId, body) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
        const reseller = await this.prisma.reseller.create({
            data: {
                groupId,
                subsidiaryId,
                name: body.name,
                status: body.status ?? "active",
            },
        });
        return {
            id: reseller.id,
            name: reseller.name,
            status: reseller.status,
        };
    }
    async listCreditAccounts(groupId, subsidiaryId, query) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
        const where = {
            groupId,
            subsidiaryId,
            ...(query.status ? { status: query.status } : {}),
        };
        const [total, accounts] = await this.prisma.$transaction([
            this.prisma.creditAccount.count({ where }),
            this.prisma.creditAccount.findMany({ where, orderBy: { createdAt: "desc" }, skip: query.offset ?? 0, take: query.limit ?? 50 }),
        ]);
        return {
            data: accounts.map((account) => ({
                id: account.id,
                reseller_id: account.resellerId,
                limit_amount: Number(account.limitAmount),
                used_amount: Number(account.usedAmount),
                status: account.status,
            })),
            meta: this.buildMeta(query, total),
        };
    }
    async createCreditAccount(groupId, subsidiaryId, body) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
        const account = await this.prisma.creditAccount.create({
            data: {
                groupId,
                subsidiaryId,
                resellerId: body.reseller_id,
                limitAmount: body.limit_amount,
            },
        });
        return {
            id: account.id,
            reseller_id: account.resellerId,
            limit_amount: Number(account.limitAmount),
            used_amount: Number(account.usedAmount),
            status: account.status,
        };
    }
    async updateCreditLimit(groupId, subsidiaryId, body) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
        const existing = await this.prisma.creditAccount.findFirst({
            where: { groupId, subsidiaryId, resellerId: body.reseller_id },
        });
        if (!existing) {
            const created = await this.prisma.creditAccount.create({
                data: {
                    groupId,
                    subsidiaryId,
                    resellerId: body.reseller_id,
                    limitAmount: body.limit_amount,
                },
            });
            return {
                id: created.id,
                reseller_id: created.resellerId,
                limit_amount: Number(created.limitAmount),
                used_amount: Number(created.usedAmount),
                status: created.status,
            };
        }
        const account = await this.prisma.creditAccount.update({
            where: { id: existing.id },
            data: { limitAmount: body.limit_amount },
        });
        return {
            id: account.id,
            reseller_id: account.resellerId,
            limit_amount: Number(account.limitAmount),
            used_amount: Number(account.usedAmount),
            status: account.status,
        };
    }
    async createRepayment(groupId, subsidiaryId, body) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
        const account = await this.prisma.creditAccount.findFirst({
            where: { id: body.credit_account_id, groupId, subsidiaryId },
        });
        if (!account)
            throw new common_1.NotFoundException("Credit account not found");
        const repayment = await this.prisma.repayment.create({
            data: {
                groupId,
                subsidiaryId,
                creditAccountId: body.credit_account_id,
                amount: body.amount,
                paidAt: body.paid_at ? new Date(body.paid_at) : new Date(),
            },
        });
        return {
            id: repayment.id,
            credit_account_id: repayment.creditAccountId,
            amount: Number(repayment.amount),
            paid_at: repayment.paidAt.toISOString(),
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
exports.CreditService = CreditService;
exports.CreditService = CreditService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CreditService);
//# sourceMappingURL=credit.service.js.map