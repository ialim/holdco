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
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let InventoryService = class InventoryService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listStockLevels(groupId, subsidiaryId, locationId, query) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
        const where = {
            groupId,
            subsidiaryId,
            ...(locationId ? { locationId } : {}),
        };
        const [total, levels] = await this.prisma.$transaction([
            this.prisma.stockLevel.count({ where }),
            this.prisma.stockLevel.findMany({
                where,
                orderBy: { updatedAt: "desc" },
                skip: query.offset ?? 0,
                take: query.limit ?? 50,
            }),
        ]);
        return {
            data: levels.map((level) => ({
                id: level.id,
                product_id: level.productId,
                variant_id: level.variantId ?? undefined,
                location_id: level.locationId,
                on_hand: level.onHand,
                reserved: level.reserved,
                available: level.onHand - level.reserved,
            })),
            meta: this.buildMeta(query, total),
        };
    }
    async createStockAdjustment(groupId, subsidiaryId, body, createdById) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
        const variantKey = body.variant_id ?? null;
        const adjustment = await this.prisma.$transaction(async (tx) => {
            const created = await tx.stockAdjustment.create({
                data: {
                    groupId,
                    subsidiaryId,
                    locationId: body.location_id,
                    productId: body.product_id,
                    variantId: body.variant_id,
                    quantity: body.quantity,
                    reason: body.reason,
                    createdById,
                },
            });
            const existingLevel = await tx.stockLevel.findFirst({
                where: {
                    groupId,
                    subsidiaryId,
                    locationId: body.location_id,
                    productId: body.product_id,
                    variantId: variantKey,
                },
            });
            if (existingLevel) {
                await tx.stockLevel.update({
                    where: { id: existingLevel.id },
                    data: { onHand: { increment: body.quantity } },
                });
            }
            else {
                await tx.stockLevel.create({
                    data: {
                        groupId,
                        subsidiaryId,
                        locationId: body.location_id,
                        productId: body.product_id,
                        variantId: body.variant_id,
                        onHand: body.quantity,
                        reserved: 0,
                    },
                });
            }
            return created;
        });
        return {
            id: adjustment.id,
            product_id: adjustment.productId,
            variant_id: adjustment.variantId ?? undefined,
            location_id: adjustment.locationId,
            quantity: adjustment.quantity,
            reason: adjustment.reason,
            created_at: adjustment.createdAt.toISOString(),
        };
    }
    async createStockTransfer(groupId, subsidiaryId, body) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
        const transfer = await this.prisma.stockTransfer.create({
            data: {
                groupId,
                subsidiaryId,
                fromLocationId: body.from_location_id,
                toLocationId: body.to_location_id,
                productId: body.product_id,
                variantId: body.variant_id,
                quantity: body.quantity,
            },
        });
        return {
            id: transfer.id,
            product_id: transfer.productId,
            variant_id: transfer.variantId ?? undefined,
            from_location_id: transfer.fromLocationId,
            to_location_id: transfer.toLocationId,
            quantity: transfer.quantity,
            status: transfer.status,
            created_at: transfer.createdAt.toISOString(),
        };
    }
    async createStockReservation(groupId, subsidiaryId, locationId, body) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
        if (!locationId)
            throw new common_1.BadRequestException("X-Location-Id header is required");
        const variantKey = body.variant_id ?? null;
        const reservation = await this.prisma.$transaction(async (tx) => {
            const created = await tx.stockReservation.create({
                data: {
                    groupId,
                    subsidiaryId,
                    locationId,
                    orderId: body.order_id,
                    productId: body.product_id,
                    variantId: body.variant_id,
                    quantity: body.quantity,
                },
            });
            const existingLevel = await tx.stockLevel.findFirst({
                where: {
                    groupId,
                    subsidiaryId,
                    locationId,
                    productId: body.product_id,
                    variantId: variantKey,
                },
            });
            if (existingLevel) {
                await tx.stockLevel.update({
                    where: { id: existingLevel.id },
                    data: { reserved: { increment: body.quantity } },
                });
            }
            else {
                await tx.stockLevel.create({
                    data: {
                        groupId,
                        subsidiaryId,
                        locationId,
                        productId: body.product_id,
                        variantId: body.variant_id,
                        onHand: 0,
                        reserved: body.quantity,
                    },
                });
            }
            return created;
        });
        return {
            id: reservation.id,
            order_id: reservation.orderId,
            product_id: reservation.productId,
            variant_id: reservation.variantId ?? undefined,
            location_id: reservation.locationId,
            quantity: reservation.quantity,
            status: reservation.status,
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
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map