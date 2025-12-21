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
exports.PricingController = void 0;
const common_1 = require("@nestjs/common");
const permissions_decorator_1 = require("../auth/permissions.decorator");
const permissions_guard_1 = require("../auth/permissions.guard");
const list_query_dto_1 = require("../common/dto/list-query.dto");
const create_price_list_dto_1 = require("./dto/create-price-list.dto");
const create_price_rule_dto_1 = require("./dto/create-price-rule.dto");
const create_promotion_dto_1 = require("./dto/create-promotion.dto");
const pricing_service_1 = require("./pricing.service");
let PricingController = class PricingController {
    constructor(pricingService) {
        this.pricingService = pricingService;
    }
    listPriceLists(groupId, subsidiaryId, query) {
        return this.pricingService.listPriceLists(groupId, subsidiaryId, query);
    }
    createPriceList(groupId, subsidiaryId, body) {
        return this.pricingService.createPriceList(groupId, subsidiaryId, body);
    }
    getPriceList(groupId, subsidiaryId, priceListId) {
        return this.pricingService.getPriceList(groupId, subsidiaryId, priceListId);
    }
    listPriceRules(groupId, subsidiaryId, query) {
        return this.pricingService.listPriceRules(groupId, subsidiaryId, query);
    }
    createPriceRule(groupId, subsidiaryId, body) {
        return this.pricingService.createPriceRule(groupId, subsidiaryId, body);
    }
    listPromotions(groupId, subsidiaryId, query) {
        return this.pricingService.listPromotions(groupId, subsidiaryId, query);
    }
    createPromotion(groupId, subsidiaryId, body) {
        return this.pricingService.createPromotion(groupId, subsidiaryId, body);
    }
};
exports.PricingController = PricingController;
__decorate([
    (0, permissions_decorator_1.Permissions)("pricing.price_list.read"),
    (0, common_1.Get)("price-lists"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, list_query_dto_1.ListQueryDto]),
    __metadata("design:returntype", void 0)
], PricingController.prototype, "listPriceLists", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("pricing.price_list.write"),
    (0, common_1.Post)("price-lists"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_price_list_dto_1.CreatePriceListDto]),
    __metadata("design:returntype", void 0)
], PricingController.prototype, "createPriceList", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("pricing.price_list.read"),
    (0, common_1.Get)("price-lists/:price_list_id"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Param)("price_list_id", new common_1.ParseUUIDPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], PricingController.prototype, "getPriceList", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("pricing.price_rule.read"),
    (0, common_1.Get)("price-rules"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, list_query_dto_1.ListQueryDto]),
    __metadata("design:returntype", void 0)
], PricingController.prototype, "listPriceRules", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("pricing.price_rule.write"),
    (0, common_1.Post)("price-rules"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_price_rule_dto_1.CreatePriceRuleDto]),
    __metadata("design:returntype", void 0)
], PricingController.prototype, "createPriceRule", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("pricing.promotion.read"),
    (0, common_1.Get)("promotions"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, list_query_dto_1.ListQueryDto]),
    __metadata("design:returntype", void 0)
], PricingController.prototype, "listPromotions", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("pricing.promotion.write"),
    (0, common_1.Post)("promotions"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_promotion_dto_1.CreatePromotionDto]),
    __metadata("design:returntype", void 0)
], PricingController.prototype, "createPromotion", null);
exports.PricingController = PricingController = __decorate([
    (0, common_1.Controller)("v1"),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })),
    __metadata("design:paramtypes", [pricing_service_1.PricingService])
], PricingController);
//# sourceMappingURL=pricing.controller.js.map