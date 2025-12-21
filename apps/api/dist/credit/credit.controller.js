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
exports.CreditController = void 0;
const common_1 = require("@nestjs/common");
const permissions_decorator_1 = require("../auth/permissions.decorator");
const permissions_guard_1 = require("../auth/permissions.guard");
const list_query_dto_1 = require("../common/dto/list-query.dto");
const credit_service_1 = require("./credit.service");
const create_credit_account_dto_1 = require("./dto/create-credit-account.dto");
const create_repayment_dto_1 = require("./dto/create-repayment.dto");
const create_reseller_dto_1 = require("./dto/create-reseller.dto");
const credit_limit_dto_1 = require("./dto/credit-limit.dto");
let CreditController = class CreditController {
    constructor(creditService) {
        this.creditService = creditService;
    }
    listResellers(groupId, subsidiaryId, query) {
        return this.creditService.listResellers(groupId, subsidiaryId, query);
    }
    createReseller(groupId, subsidiaryId, body) {
        return this.creditService.createReseller(groupId, subsidiaryId, body);
    }
    listCreditAccounts(groupId, subsidiaryId, query) {
        return this.creditService.listCreditAccounts(groupId, subsidiaryId, query);
    }
    createCreditAccount(groupId, subsidiaryId, body) {
        return this.creditService.createCreditAccount(groupId, subsidiaryId, body);
    }
    updateCreditLimit(groupId, subsidiaryId, body) {
        return this.creditService.updateCreditLimit(groupId, subsidiaryId, body);
    }
    createRepayment(groupId, subsidiaryId, body) {
        return this.creditService.createRepayment(groupId, subsidiaryId, body);
    }
};
exports.CreditController = CreditController;
__decorate([
    (0, permissions_decorator_1.Permissions)("credit.reseller.read"),
    (0, common_1.Get)("resellers"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, list_query_dto_1.ListQueryDto]),
    __metadata("design:returntype", void 0)
], CreditController.prototype, "listResellers", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("credit.reseller.write"),
    (0, common_1.Post)("resellers"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_reseller_dto_1.CreateResellerDto]),
    __metadata("design:returntype", void 0)
], CreditController.prototype, "createReseller", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("credit.account.read"),
    (0, common_1.Get)("credit-accounts"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, list_query_dto_1.ListQueryDto]),
    __metadata("design:returntype", void 0)
], CreditController.prototype, "listCreditAccounts", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("credit.account.write"),
    (0, common_1.Post)("credit-accounts"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_credit_account_dto_1.CreateCreditAccountDto]),
    __metadata("design:returntype", void 0)
], CreditController.prototype, "createCreditAccount", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("credit.limit.write"),
    (0, common_1.Post)("credit-limits"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, credit_limit_dto_1.CreditLimitDto]),
    __metadata("design:returntype", void 0)
], CreditController.prototype, "updateCreditLimit", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("credit.repayment.write"),
    (0, common_1.Post)("repayments"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_repayment_dto_1.CreateRepaymentDto]),
    __metadata("design:returntype", void 0)
], CreditController.prototype, "createRepayment", null);
exports.CreditController = CreditController = __decorate([
    (0, common_1.Controller)("v1"),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })),
    __metadata("design:paramtypes", [credit_service_1.CreditService])
], CreditController);
//# sourceMappingURL=credit.controller.js.map