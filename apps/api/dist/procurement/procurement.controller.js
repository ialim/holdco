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
exports.ProcurementController = void 0;
const common_1 = require("@nestjs/common");
const permissions_decorator_1 = require("../auth/permissions.decorator");
const permissions_guard_1 = require("../auth/permissions.guard");
const list_query_dto_1 = require("../common/dto/list-query.dto");
const procurement_service_1 = require("./procurement.service");
const create_purchase_request_dto_1 = require("./dto/create-purchase-request.dto");
const create_purchase_order_dto_1 = require("./dto/create-purchase-order.dto");
let ProcurementController = class ProcurementController {
    constructor(procurementService) {
        this.procurementService = procurementService;
    }
    listPurchaseRequests(groupId, subsidiaryId, query) {
        return this.procurementService.listPurchaseRequests(groupId, subsidiaryId, query);
    }
    createPurchaseRequest(groupId, subsidiaryId, body) {
        return this.procurementService.createPurchaseRequest(groupId, subsidiaryId, body);
    }
    listPurchaseOrders(groupId, subsidiaryId, query) {
        return this.procurementService.listPurchaseOrders(groupId, subsidiaryId, query);
    }
    createPurchaseOrder(groupId, subsidiaryId, body) {
        return this.procurementService.createPurchaseOrder(groupId, subsidiaryId, body);
    }
};
exports.ProcurementController = ProcurementController;
__decorate([
    (0, permissions_decorator_1.Permissions)("procurement.request.manage"),
    (0, common_1.Get)("procurement/purchase-requests"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, list_query_dto_1.ListQueryDto]),
    __metadata("design:returntype", void 0)
], ProcurementController.prototype, "listPurchaseRequests", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("procurement.request.manage"),
    (0, common_1.Post)("procurement/purchase-requests"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_purchase_request_dto_1.CreatePurchaseRequestDto]),
    __metadata("design:returntype", void 0)
], ProcurementController.prototype, "createPurchaseRequest", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("procurement.order.manage"),
    (0, common_1.Get)("procurement/purchase-orders"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, list_query_dto_1.ListQueryDto]),
    __metadata("design:returntype", void 0)
], ProcurementController.prototype, "listPurchaseOrders", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("procurement.order.manage"),
    (0, common_1.Post)("procurement/purchase-orders"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_purchase_order_dto_1.CreatePurchaseOrderDto]),
    __metadata("design:returntype", void 0)
], ProcurementController.prototype, "createPurchaseOrder", null);
exports.ProcurementController = ProcurementController = __decorate([
    (0, common_1.Controller)("v1"),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })),
    __metadata("design:paramtypes", [procurement_service_1.ProcurementService])
], ProcurementController);
//# sourceMappingURL=procurement.controller.js.map