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
exports.OrdersController = void 0;
const common_1 = require("@nestjs/common");
const permissions_decorator_1 = require("../auth/permissions.decorator");
const permissions_guard_1 = require("../auth/permissions.guard");
const list_query_dto_1 = require("../common/dto/list-query.dto");
const create_order_dto_1 = require("./dto/create-order.dto");
const orders_service_1 = require("./orders.service");
let OrdersController = class OrdersController {
    constructor(ordersService) {
        this.ordersService = ordersService;
    }
    listOrders(groupId, subsidiaryId, query) {
        return this.ordersService.listOrders(groupId, subsidiaryId, query);
    }
    createOrder(groupId, subsidiaryId, locationId, channel, body) {
        return this.ordersService.createOrder(groupId, subsidiaryId, locationId, channel, body);
    }
    getOrder(groupId, subsidiaryId, orderId) {
        return this.ordersService.getOrder(groupId, subsidiaryId, orderId);
    }
    cancelOrder(groupId, subsidiaryId, orderId) {
        return this.ordersService.cancelOrder(groupId, subsidiaryId, orderId);
    }
    fulfillOrder(groupId, subsidiaryId, orderId) {
        return this.ordersService.fulfillOrder(groupId, subsidiaryId, orderId);
    }
};
exports.OrdersController = OrdersController;
__decorate([
    (0, permissions_decorator_1.Permissions)("orders.read"),
    (0, common_1.Get)("orders"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, list_query_dto_1.ListQueryDto]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "listOrders", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("orders.write"),
    (0, common_1.Post)("orders"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Headers)("x-location-id")),
    __param(3, (0, common_1.Headers)("x-channel")),
    __param(4, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object, create_order_dto_1.CreateOrderDto]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "createOrder", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("orders.read"),
    (0, common_1.Get)("orders/:order_id"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Param)("order_id", new common_1.ParseUUIDPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "getOrder", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("orders.cancel"),
    (0, common_1.Post)("orders/:order_id/cancel"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Param)("order_id", new common_1.ParseUUIDPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "cancelOrder", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("orders.fulfill"),
    (0, common_1.Post)("orders/:order_id/fulfill"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Param)("order_id", new common_1.ParseUUIDPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "fulfillOrder", null);
exports.OrdersController = OrdersController = __decorate([
    (0, common_1.Controller)("v1"),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })),
    __metadata("design:paramtypes", [orders_service_1.OrdersService])
], OrdersController);
//# sourceMappingURL=orders.controller.js.map