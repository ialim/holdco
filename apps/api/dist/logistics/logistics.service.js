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
exports.LogisticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let LogisticsService = class LogisticsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listShipments(groupId, subsidiaryId, query) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
        const where = {
            groupId,
            subsidiaryId,
            ...(query.status ? { status: query.status } : {}),
        };
        const [total, shipments] = await this.prisma.$transaction([
            this.prisma.shipment.count({ where }),
            this.prisma.shipment.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: query.offset ?? 0,
                take: query.limit ?? 50,
            }),
        ]);
        return {
            data: shipments.map((shipment) => ({
                id: shipment.id,
                order_id: shipment.orderId,
                carrier: shipment.carrier,
                status: shipment.status,
                tracking_no: shipment.trackingNo ?? undefined,
            })),
            meta: this.buildMeta(query, total),
        };
    }
    async createShipment(groupId, subsidiaryId, body) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
        const shipment = await this.prisma.shipment.create({
            data: {
                groupId,
                subsidiaryId,
                orderId: body.order_id,
                carrier: body.carrier,
                trackingNo: body.tracking_no,
            },
        });
        return {
            id: shipment.id,
            order_id: shipment.orderId,
            carrier: shipment.carrier,
            status: shipment.status,
            tracking_no: shipment.trackingNo ?? undefined,
        };
    }
    async getShipment(groupId, subsidiaryId, shipmentId) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
        const shipment = await this.prisma.shipment.findFirst({
            where: { id: shipmentId, groupId, subsidiaryId },
        });
        if (!shipment)
            throw new common_1.NotFoundException("Shipment not found");
        return {
            id: shipment.id,
            order_id: shipment.orderId,
            carrier: shipment.carrier,
            status: shipment.status,
            tracking_no: shipment.trackingNo ?? undefined,
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
exports.LogisticsService = LogisticsService;
exports.LogisticsService = LogisticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LogisticsService);
//# sourceMappingURL=logistics.service.js.map