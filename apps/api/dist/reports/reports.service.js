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
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ReportsService = class ReportsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async salesReport(groupId, subsidiaryId, query) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
        const createdAt = {};
        if (query.start_date) {
            createdAt.gte = new Date(query.start_date);
        }
        if (query.end_date) {
            const end = new Date(query.end_date);
            end.setHours(23, 59, 59, 999);
            createdAt.lte = end;
        }
        const where = {
            groupId,
            subsidiaryId,
            ...(createdAt.gte || createdAt.lte ? { createdAt } : {}),
        };
        const orders = await this.prisma.order.findMany({
            where,
            select: { createdAt: true, totalAmount: true },
            orderBy: { createdAt: "asc" },
        });
        const buckets = new Map();
        for (const order of orders) {
            const dateKey = order.createdAt.toISOString().slice(0, 10);
            const existing = buckets.get(dateKey) ?? { revenue: 0, orders_count: 0 };
            existing.revenue += Number(order.totalAmount);
            existing.orders_count += 1;
            buckets.set(dateKey, existing);
        }
        const data = Array.from(buckets.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, metrics]) => ({
            date,
            revenue: metrics.revenue,
            orders_count: metrics.orders_count,
        }));
        return { data };
    }
    async inventoryReport(groupId, subsidiaryId) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
        const levels = await this.prisma.stockLevel.findMany({
            where: { groupId, subsidiaryId },
            include: { product: true },
        });
        return {
            data: levels.map((level) => ({
                sku: level.product.sku,
                location_id: level.locationId,
                on_hand: level.onHand,
            })),
        };
    }
    async creditReport(groupId, subsidiaryId) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
        const accounts = await this.prisma.creditAccount.findMany({
            where: { groupId, subsidiaryId },
            select: { resellerId: true, usedAmount: true },
        });
        return {
            data: accounts.map((account) => ({
                reseller_id: account.resellerId,
                balance: Number(account.usedAmount),
            })),
        };
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map