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
exports.CatalogService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CatalogService = class CatalogService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listBrands(groupId, query) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        const where = {
            groupId,
            ...(query.q
                ? {
                    name: {
                        contains: query.q,
                        mode: "insensitive",
                    },
                }
                : {}),
        };
        const [total, brands] = await this.prisma.$transaction([
            this.prisma.brand.count({ where }),
            this.prisma.brand.findMany({ where, orderBy: { name: "asc" }, skip: query.offset ?? 0, take: query.limit ?? 50 }),
        ]);
        return {
            data: brands.map(this.mapBrand),
            meta: this.buildMeta(query, total),
        };
    }
    async createBrand(groupId, body) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        const brand = await this.prisma.brand.create({
            data: {
                groupId,
                name: body.name,
            },
        });
        return this.mapBrand(brand);
    }
    async listSuppliers(groupId, query) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        const where = {
            groupId,
            ...(query.q
                ? {
                    name: {
                        contains: query.q,
                        mode: "insensitive",
                    },
                }
                : {}),
        };
        const [total, suppliers] = await this.prisma.$transaction([
            this.prisma.supplier.count({ where }),
            this.prisma.supplier.findMany({ where, orderBy: { name: "asc" }, skip: query.offset ?? 0, take: query.limit ?? 50 }),
        ]);
        return {
            data: suppliers.map(this.mapSupplier),
            meta: this.buildMeta(query, total),
        };
    }
    async createSupplier(groupId, body) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        const supplier = await this.prisma.supplier.create({
            data: {
                groupId,
                name: body.name,
                contactName: body.contact_name,
                contactPhone: body.contact_phone,
            },
        });
        return this.mapSupplier(supplier);
    }
    async listProducts(groupId, subsidiaryId, query) {
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
                    OR: [
                        { name: { contains: query.q, mode: "insensitive" } },
                        { sku: { contains: query.q, mode: "insensitive" } },
                    ],
                }
                : {}),
        };
        const [total, products] = await this.prisma.$transaction([
            this.prisma.product.count({ where }),
            this.prisma.product.findMany({ where, orderBy: { createdAt: "desc" }, skip: query.offset ?? 0, take: query.limit ?? 50 }),
        ]);
        return {
            data: products.map(this.mapProduct),
            meta: this.buildMeta(query, total),
        };
    }
    async createProduct(groupId, subsidiaryId, body) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
        const product = await this.prisma.product.create({
            data: {
                groupId,
                subsidiaryId,
                sku: body.sku,
                name: body.name,
                brandId: body.brand_id,
            },
        });
        return this.mapProduct(product);
    }
    async getProduct(groupId, subsidiaryId, productId) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
        const product = await this.prisma.product.findFirst({
            where: { id: productId, groupId, subsidiaryId },
        });
        if (!product)
            throw new common_1.NotFoundException("Product not found");
        return this.mapProduct(product);
    }
    async listVariants(groupId, subsidiaryId, query) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
        const where = {
            groupId,
            subsidiaryId,
            ...(query.barcode ? { barcode: query.barcode } : {}),
        };
        const [total, variants] = await this.prisma.$transaction([
            this.prisma.variant.count({ where }),
            this.prisma.variant.findMany({ where, orderBy: { createdAt: "desc" }, skip: query.offset ?? 0, take: query.limit ?? 50 }),
        ]);
        return {
            data: variants.map(this.mapVariant),
            meta: this.buildMeta(query, total),
        };
    }
    async createVariant(groupId, subsidiaryId, body) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
        const variant = await this.prisma.variant.create({
            data: {
                groupId,
                subsidiaryId,
                productId: body.product_id,
                size: body.size,
                unit: body.unit,
                barcode: body.barcode,
            },
        });
        return this.mapVariant(variant);
    }
    mapBrand(brand) {
        return {
            id: brand.id,
            name: brand.name,
            created_at: brand.createdAt.toISOString(),
        };
    }
    mapSupplier(supplier) {
        return {
            id: supplier.id,
            name: supplier.name,
            contact_name: supplier.contactName ?? undefined,
            contact_phone: supplier.contactPhone ?? undefined,
            created_at: supplier.createdAt.toISOString(),
        };
    }
    mapProduct(product) {
        return {
            id: product.id,
            sku: product.sku,
            name: product.name,
            brand_id: product.brandId ?? undefined,
            status: product.status,
            created_at: product.createdAt.toISOString(),
        };
    }
    mapVariant(variant) {
        return {
            id: variant.id,
            product_id: variant.productId,
            size: variant.size ?? undefined,
            unit: variant.unit ?? undefined,
            barcode: variant.barcode ?? undefined,
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
exports.CatalogService = CatalogService;
exports.CatalogService = CatalogService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CatalogService);
//# sourceMappingURL=catalog.service.js.map