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
exports.LoyaltyController = void 0;
const common_1 = require("@nestjs/common");
const permissions_decorator_1 = require("../auth/permissions.decorator");
const permissions_guard_1 = require("../auth/permissions.guard");
const list_query_dto_1 = require("../common/dto/list-query.dto");
const loyalty_service_1 = require("./loyalty.service");
const create_customer_dto_1 = require("./dto/create-customer.dto");
const create_loyalty_account_dto_1 = require("./dto/create-loyalty-account.dto");
const issue_points_dto_1 = require("./dto/issue-points.dto");
let LoyaltyController = class LoyaltyController {
    constructor(loyaltyService) {
        this.loyaltyService = loyaltyService;
    }
    listCustomers(groupId, subsidiaryId, query) {
        return this.loyaltyService.listCustomers(groupId, subsidiaryId, query);
    }
    createCustomer(groupId, subsidiaryId, body) {
        return this.loyaltyService.createCustomer(groupId, subsidiaryId, body);
    }
    listLoyaltyAccounts(groupId, subsidiaryId, query) {
        return this.loyaltyService.listLoyaltyAccounts(groupId, subsidiaryId, query);
    }
    createLoyaltyAccount(groupId, subsidiaryId, body) {
        return this.loyaltyService.createLoyaltyAccount(groupId, subsidiaryId, body);
    }
    issuePoints(groupId, subsidiaryId, body) {
        return this.loyaltyService.issuePoints(groupId, subsidiaryId, body);
    }
};
exports.LoyaltyController = LoyaltyController;
__decorate([
    (0, permissions_decorator_1.Permissions)("loyalty.customer.read"),
    (0, common_1.Get)("customers"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, list_query_dto_1.ListQueryDto]),
    __metadata("design:returntype", void 0)
], LoyaltyController.prototype, "listCustomers", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("loyalty.customer.write"),
    (0, common_1.Post)("customers"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_customer_dto_1.CreateCustomerDto]),
    __metadata("design:returntype", void 0)
], LoyaltyController.prototype, "createCustomer", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("loyalty.account.read"),
    (0, common_1.Get)("loyalty-accounts"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, list_query_dto_1.ListQueryDto]),
    __metadata("design:returntype", void 0)
], LoyaltyController.prototype, "listLoyaltyAccounts", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("loyalty.account.write"),
    (0, common_1.Post)("loyalty-accounts"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_loyalty_account_dto_1.CreateLoyaltyAccountDto]),
    __metadata("design:returntype", void 0)
], LoyaltyController.prototype, "createLoyaltyAccount", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("loyalty.points.issue"),
    (0, common_1.Post)("points/issue"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, issue_points_dto_1.IssuePointsDto]),
    __metadata("design:returntype", void 0)
], LoyaltyController.prototype, "issuePoints", null);
exports.LoyaltyController = LoyaltyController = __decorate([
    (0, common_1.Controller)("v1"),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })),
    __metadata("design:paramtypes", [loyalty_service_1.LoyaltyService])
], LoyaltyController);
//# sourceMappingURL=loyalty.controller.js.map