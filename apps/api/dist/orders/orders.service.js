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
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let OrdersService = class OrdersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listOrders(groupId, subsidiaryId, query) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
        const createdAt = {};
        if (query.start_date) {
            createdAt.gte = new Date(query.start_date);
        }
        if (query.end_date) {
            createdAt.lte = new Date(query.end_date);
        }
        const where = {
            groupId,
            subsidiaryId,
            ...(query.status ? { status: query.status } : {}),
            ...(createdAt.gte || createdAt.lte ? { createdAt } : {}),
        };
        const [total, orders] = await this.prisma.$transaction([
            this.prisma.order.count({ where }),
            this.prisma.order.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: query.offset ?? 0,
                take: query.limit ?? 50,
                include: { items: true },
            }),
        ]);
        return {
            data: orders.map(this.mapOrder),
            meta: this.buildMeta(query, total),
        };
    }
    async createOrder(groupId, subsidiaryId, locationId, channel, body) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
        if (!body.items?.length)
            throw new common_1.BadRequestException("Order items are required");
        const currency = body.currency ?? "NGN";
        const orderNo = `ORD-${Date.now()}`;
        const items = body.items.map((item) => {
            const unitPrice = item.unit_price ?? 0;
            const totalPrice = unitPrice * item.quantity;
            return {
                productId: item.product_id,
                variantId: item.variant_id,
                quantity: item.quantity,
                unitPrice,
                totalPrice,
            };
        });
        const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
        const order = await this.prisma.order.create({
            data: {
                groupId,
                subsidiaryId,
                locationId: locationId ?? undefined,
                channel: channel ?? undefined,
                orderNo,
                customerId: body.customer_id,
                resellerId: body.reseller_id,
                status: "pending",
                totalAmount,
                currency,
                items: { create: items },
            },
            include: { items: true },
        });
        return this.mapOrder(order);
    }
    async getOrder(groupId, subsidiaryId, orderId) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, groupId, subsidiaryId },
            include: { items: true },
        });
        if (!order)
            throw new common_1.NotFoundException("Order not found");
        return this.mapOrder(order);
    }
    async cancelOrder(groupId, subsidiaryId, orderId) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
        const order = await this.prisma.order.update({
            where: { id: orderId },
            data: { status: "cancelled" },
            include: { items: true },
        });
        return this.mapOrder(order);
    }
    async fulfillOrder(groupId, subsidiaryId, orderId) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
        const order = await this.prisma.order.update({
            where: { id: orderId },
            data: { status: "fulfilled" },
            include: { items: true },
        });
        return this.mapOrder(order);
    }
    mapOrder(order) {
        return {
            id: order.id,
            order_no: order.orderNo,
            status: order.status,
            customer_id: order.customerId ?? undefined,
            reseller_id: order.resellerId ?? undefined,
            total_amount: Number(order.totalAmount),
            currency: order.currency,
            items: order.items.map((item) => ({
                product_id: item.productId,
                variant_id: item.variantId ?? undefined,
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
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map