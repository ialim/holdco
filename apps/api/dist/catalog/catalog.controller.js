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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatalogController = void 0;
const common_1 = require("@nestjs/common");
const permissions_decorator_1 = require("../auth/permissions.decorator");
const permissions_guard_1 = require("../auth/permissions.guard");
const list_query_dto_1 = require("../common/dto/list-query.dto");
const create_brand_dto_1 = require("./dto/create-brand.dto");
const create_product_dto_1 = require("./dto/create-product.dto");
const create_supplier_dto_1 = require("./dto/create-supplier.dto");
const create_variant_dto_1 = require("./dto/create-variant.dto");
const catalog_service_1 = require("./catalog.service");
let CatalogController = class CatalogController {
    constructor(catalogService) {
        this.catalogService = catalogService;
    }
    listBrands(groupId, query) {
        return this.catalogService.listBrands(groupId, query);
    }
    createBrand(groupId, body) {
        return this.catalogService.createBrand(groupId, body);
    }
    listSuppliers(groupId, query) {
        return this.catalogService.listSuppliers(groupId, query);
    }
    createSupplier(groupId, body) {
        return this.catalogService.createSupplier(groupId, body);
    }
    listProducts(groupId, subsidiaryId, query) {
        return this.catalogService.listProducts(groupId, subsidiaryId, query);
    }
    createProduct(groupId, subsidiaryId, body) {
        return this.catalogService.createProduct(groupId, subsidiaryId, body);
    }
    getProduct(groupId, subsidiaryId, productId) {
        return this.catalogService.getProduct(groupId, subsidiaryId, productId);
    }
    listVariants(groupId, subsidiaryId, query) {
        return this.catalogService.listVariants(groupId, subsidiaryId, query);
    }
    createVariant(groupId, subsidiaryId, body) {
        return this.catalogService.createVariant(groupId, subsidiaryId, body);
    }
};
exports.CatalogController = CatalogController;
__decorate([
    (0, permissions_decorator_1.Permissions)("catalog.brand.read"),
    (0, common_1.Get)("brands"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, list_query_dto_1.ListQueryDto]),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "listBrands", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("catalog.brand.write"),
    (0, common_1.Post)("brands"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_brand_dto_1.CreateBrandDto]),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "createBrand", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("catalog.supplier.read"),
    (0, common_1.Get)("suppliers"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, list_query_dto_1.ListQueryDto]),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "listSuppliers", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("catalog.supplier.write"),
    (0, common_1.Post)("suppliers"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_supplier_dto_1.CreateSupplierDto]),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "createSupplier", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("catalog.product.read"),
    (0, common_1.Get)("products"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, list_query_dto_1.ListQueryDto]),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "listProducts", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("catalog.product.write"),
    (0, common_1.Post)("products"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_product_dto_1.CreateProductDto]),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "createProduct", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("catalog.product.read"),
    (0, common_1.Get)("products/:product_id"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Param)("product_id", new common_1.ParseUUIDPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "getProduct", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("catalog.variant.read"),
    (0, common_1.Get)("variants"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, list_query_dto_1.ListQueryDto]),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "listVariants", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("catalog.variant.write"),
    (0, common_1.Post)("variants"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_variant_dto_1.CreateVariantDto]),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "createVariant", null);
exports.CatalogController = CatalogController = __decorate([
    (0, common_1.Controller)("v1"),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })),
    __metadata("design:paramtypes", [catalog_service_1.CatalogService])
], CatalogController);
//# sourceMappingURL=catalog.controller.js.map