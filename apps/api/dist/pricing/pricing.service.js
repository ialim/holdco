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
exports.PricingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PricingService = class PricingService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listPriceLists(groupId, subsidiaryId, query) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
        const where = {
            groupId,
            subsidiaryId,
        };
        const [total, priceLists] = await this.prisma.$transaction([
            this.prisma.priceList.count({ where }),
            this.prisma.priceList.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: query.offset ?? 0,
                take: query.limit ?? 50,
            }),
        ]);
        return {
            data: priceLists.map(this.mapPriceList),
            meta: this.buildMeta(query, total),
        };
    }
    async createPriceList(groupId, subsidiaryId, body) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
        const priceList = await this.prisma.priceList.create({
            data: {
                groupId,
                subsidiaryId,
                name: body.name,
                currency: body.currency,
                channel: body.channel,
                validFrom: body.valid_from ? new Date(body.valid_from) : undefined,
                validTo: body.valid_to ? new Date(body.valid_to) : undefined,
            },
        });
        return this.mapPriceList(priceList);
    }
    async getPriceList(groupId, subsidiaryId, priceListId) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
        const priceList = await this.prisma.priceList.findFirst({ where: { id: priceListId, groupId, subsidiaryId } });
        if (!priceList)
            throw new common_1.NotFoundException("Price list not found");
        return this.mapPriceList(priceList);
    }
    async listPriceRules(groupId, subsidiaryId, query) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
        const where = {
            groupId,
            subsidiaryId,
            ...(query.price_list_id ? { priceListId: query.price_list_id } : {}),
        };
        const [total, priceRules] = await this.prisma.$transaction([
            this.prisma.priceRule.count({ where }),
            this.prisma.priceRule.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: query.offset ?? 0,
                take: query.limit ?? 50,
            }),
        ]);
        return {
            data: priceRules.map(this.mapPriceRule),
            meta: this.buildMeta(query, total),
        };
    }
    async createPriceRule(groupId, subsidiaryId, body) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
        const priceRule = await this.prisma.priceRule.create({
            data: {
                groupId,
                subsidiaryId,
                priceListId: body.price_list_id,
                productId: body.product_id,
                variantId: body.variant_id,
                minQty: body.min_qty,
                price: body.price,
            },
        });
        return this.mapPriceRule(priceRule);
    }
    async listPromotions(groupId, subsidiaryId, query) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
        const where = {
            groupId,
            subsidiaryId,
        };
        const [total, promotions] = await this.prisma.$transaction([
            this.prisma.promotion.count({ where }),
            this.prisma.promotion.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: query.offset ?? 0,
                take: query.limit ?? 50,
            }),
        ]);
        return {
            data: promotions.map(this.mapPromotion),
            meta: this.buildMeta(query, total),
        };
    }
    async createPromotion(groupId, subsidiaryId, body) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
        const promotion = await this.prisma.promotion.create({
            data: {
                groupId,
                subsidiaryId,
                code: body.code,
                type: body.type,
                value: body.value,
                startAt: new Date(body.start_at),
                endAt: new Date(body.end_at),
            },
        });
        return this.mapPromotion(promotion);
    }
    mapPriceList(priceList) {
        return {
            id: priceList.id,
            name: priceList.name,
            currency: priceList.currency,
            channel: priceList.channel ?? undefined,
            valid_from: priceList.validFrom ? priceList.validFrom.toISOString().slice(0, 10) : undefined,
            valid_to: priceList.validTo ? priceList.validTo.toISOString().slice(0, 10) : undefined,
        };
    }
    mapPriceRule(priceRule) {
        return {
            id: priceRule.id,
            price_list_id: priceRule.priceListId,
            product_id: priceRule.productId,
            variant_id: priceRule.variantId ?? undefined,
            min_qty: priceRule.minQty,
            price: Number(priceRule.price),
        };
    }
    mapPromotion(promotion) {
        return {
            id: promotion.id,
            code: promotion.code,
            type: promotion.type,
            value: Number(promotion.value),
            start_at: promotion.startAt.toISOString(),
            end_at: promotion.endAt.toISOString(),
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
exports.PricingService = PricingService;
exports.PricingService = PricingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PricingService);
//# sourceMappingURL=pricing.service.js.map