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
exports.CostPoolService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const library_1 = require("@prisma/client/runtime/library");
const finance_enums_1 = require("./finance.enums");
let CostPoolService = class CostPoolService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createCostPool(params) {
        const totalCost = params.lines.reduce((sum, l) => sum.plus(new library_1.Decimal(l.amount)), new library_1.Decimal(0));
        const costPool = await this.prisma.costPool.upsert({
            where: { companyId_period: { companyId: params.holdcoCompanyId, period: params.period } },
            update: {
                totalCost,
                lines: { deleteMany: {}, create: params.lines.map((l) => ({ category: l.category, amount: new library_1.Decimal(l.amount) })) },
            },
            create: {
                companyId: params.holdcoCompanyId,
                period: params.period,
                totalCost,
                lines: { create: params.lines.map((l) => ({ category: l.category, amount: new library_1.Decimal(l.amount) })) },
            },
            include: { lines: true },
        });
        const method = params.allocationMethod ?? finance_enums_1.AllocationMethod.BY_FIXED_SPLIT;
        const rule = await this.prisma.allocationRule.upsert({
            where: { costPoolId: costPool.id },
            update: { method },
            create: { costPoolId: costPool.id, method },
        });
        if (method === finance_enums_1.AllocationMethod.BY_FIXED_SPLIT) {
            if (!params.weights?.length)
                throw new common_1.BadRequestException("BY_FIXED_SPLIT requires weights");
            const sum = params.weights.reduce((s, w) => s.plus(new library_1.Decimal(w.weight)), new library_1.Decimal(0));
            if (sum.lessThan(new library_1.Decimal("0.999")) || sum.greaterThan(new library_1.Decimal("1.001"))) {
                throw new common_1.BadRequestException(`Weights must sum to 1.0 (got ${sum.toString()})`);
            }
            await this.prisma.allocationWeight.deleteMany({ where: { allocationRuleId: rule.id } });
            await this.prisma.allocationWeight.createMany({
                data: params.weights.map((w) => ({
                    allocationRuleId: rule.id,
                    recipientCompanyId: w.recipientCompanyId,
                    weight: new library_1.Decimal(w.weight),
                })),
            });
        }
        return { costPoolId: costPool.id, totalCost: costPool.totalCost };
    }
    async allocateCostPool(costPoolId) {
        const pool = await this.prisma.costPool.findUnique({
            where: { id: costPoolId },
            include: { allocationRule: { include: { weights: true } } },
        });
        if (!pool)
            throw new common_1.BadRequestException("CostPool not found");
        if (!pool.allocationRule)
            throw new common_1.BadRequestException("AllocationRule not found");
        if (pool.allocationRule.method !== finance_enums_1.AllocationMethod.BY_FIXED_SPLIT) {
            throw new common_1.BadRequestException("Only BY_FIXED_SPLIT implemented in conservative default");
        }
        if (!pool.allocationRule.weights.length)
            throw new common_1.BadRequestException("No allocation weights set");
        await this.prisma.costAllocation.deleteMany({ where: { costPoolId: pool.id } });
        const allocations = pool.allocationRule.weights.map((w) => ({
            costPoolId: pool.id,
            recipientCompanyId: w.recipientCompanyId,
            allocatedCost: new library_1.Decimal(pool.totalCost).mul(w.weight),
        }));
        await this.prisma.costAllocation.createMany({ data: allocations });
        return { costPoolId: pool.id, allocationsCount: allocations.length };
    }
};
exports.CostPoolService = CostPoolService;
exports.CostPoolService = CostPoolService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CostPoolService);
//# sourceMappingURL=cost-pool.service.js.map