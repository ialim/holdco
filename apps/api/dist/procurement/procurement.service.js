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
exports.ProcurementService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ProcurementService = class ProcurementService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listPurchaseRequests(groupId, subsidiaryId, query) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
        const where = {
            groupId,
            subsidiaryId,
            ...(query.status ? { status: query.status } : {}),
        };
        const [total, requests] = await this.prisma.$transaction([
            this.prisma.purchaseRequest.count({ where }),
            this.prisma.purchaseRequest.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: query.offset ?? 0,
                take: query.limit ?? 50,
                include: { items: true },
            }),
        ]);
        return {
            data: requests.map((request) => ({
                id: request.id,
                requester_id: request.requesterId ?? undefined,
                status: request.status,
                needed_by: this.formatDate(request.neededBy),
                notes: request.notes ?? undefined,
                items: request.items.map((item) => ({
                    description: item.description,
                    quantity: item.quantity,
                    unit: item.unit ?? undefined,
                    estimated_unit_cost: item.estimatedUnitCost !== null
                        ? Number(item.estimatedUnitCost)
                        : undefined,
                })),
            })),
            meta: this.buildMeta(query, total),
        };
    }
    async createPurchaseRequest(groupId, subsidiaryId, body) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
        const request = await this.prisma.purchaseRequest.create({
            data: {
                groupId,
                subsidiaryId,
                requesterId: body.requester_id,
                neededBy: body.needed_by ? new Date(body.needed_by) : undefined,
                notes: body.notes,
                items: {
                    create: body.items.map((item) => ({
                        description: item.description,
                        quantity: item.quantity,
                        unit: item.unit,
                        estimatedUnitCost: item.estimated_unit_cost,
                    })),
                },
            },
            include: { items: true },
        });
        return {
            id: request.id,
            requester_id: request.requesterId ?? undefined,
            status: request.status,
            needed_by: this.formatDate(request.neededBy),
            notes: request.notes ?? undefined,
            items: request.items.map((item) => ({
                description: item.description,
                quantity: item.quantity,
                unit: item.unit ?? undefined,
                estimated_unit_cost: item.estimatedUnitCost !== null
                    ? Number(item.estimatedUnitCost)
                    : undefined,
            })),
        };
    }
    async listPurchaseOrders(groupId, subsidiaryId, query) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
        const where = {
            groupId,
            subsidiaryId,
            ...(query.status ? { status: query.status } : {}),
        };
        const [total, orders] = await this.prisma.$transaction([
            this.prisma.purchaseOrder.count({ where }),
            this.prisma.purchaseOrder.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: query.offset ?? 0,
                take: query.limit ?? 50,
                include: { items: true },
            }),
        ]);
        return {
            data: orders.map((order) => ({
                id: order.id,
                vendor_id: order.vendorId ?? undefined,
                status: order.status,
                ordered_at: order.orderedAt ? order.orderedAt.toISOString() : undefined,
                expected_at: this.formatDate(order.expectedAt),
                total_amount: order.totalAmount !== null ? Number(order.totalAmount) : undefined,
                currency: order.currency ?? undefined,
                items: order.items.map((item) => ({
                    description: item.description,
                    quantity: item.quantity,
                    unit_price: Number(item.unitPrice),
                    total_price: Number(item.totalPrice),
                })),
            })),
            meta: this.buildMeta(query, total),
        };
    }
    async createPurchaseOrder(groupId, subsidiaryId, body) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
        const items = body.items.map((item) => {
            const totalPrice = item.total_price ?? item.unit_price * item.quantity;
            return {
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unit_price,
                totalPrice,
            };
        });
        const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
        const order = await this.prisma.purchaseOrder.create({
            data: {
                groupId,
                subsidiaryId,
                vendorId: body.vendor_id,
                orderedAt: body.ordered_at ? new Date(body.ordered_at) : undefined,
                expectedAt: body.expected_at ? new Date(body.expected_at) : undefined,
                totalAmount,
                currency: body.currency ?? "NGN",
                items: {
                    create: items.map((item) => ({
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        totalPrice: item.totalPrice,
                    })),
                },
            },
            include: { items: true },
        });
        return {
            id: order.id,
            vendor_id: order.vendorId ?? undefined,
            status: order.status,
            ordered_at: order.orderedAt ? order.orderedAt.toISOString() : undefined,
            expected_at: this.formatDate(order.expectedAt),
            total_amount: order.totalAmount !== null ? Number(order.totalAmount) : undefined,
            currency: order.currency ?? undefined,
            items: order.items.map((item) => ({
                description: item.description,
                quantity: item.quantity,
                unit_price: Number(item.unitPrice),
                total_price: Number(item.totalPrice),
            })),
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
exports.ProcurementService = ProcurementService;
exports.ProcurementService = ProcurementService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProcurementService);
//# sourceMappingURL=procurement.service.js.map