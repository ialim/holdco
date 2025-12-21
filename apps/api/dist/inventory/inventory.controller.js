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
exports.InventoryController = void 0;
const common_1 = require("@nestjs/common");
const permissions_decorator_1 = require("../auth/permissions.decorator");
const permissions_guard_1 = require("../auth/permissions.guard");
const list_query_dto_1 = require("../common/dto/list-query.dto");
const inventory_service_1 = require("./inventory.service");
const stock_adjustment_dto_1 = require("./dto/stock-adjustment.dto");
const stock_reservation_dto_1 = require("./dto/stock-reservation.dto");
const stock_transfer_dto_1 = require("./dto/stock-transfer.dto");
let InventoryController = class InventoryController {
    constructor(inventoryService) {
        this.inventoryService = inventoryService;
    }
    listStockLevels(groupId, subsidiaryId, locationId, query) {
        return this.inventoryService.listStockLevels(groupId, subsidiaryId, locationId, query);
    }
    createStockAdjustment(groupId, subsidiaryId, body, req) {
        const createdById = req.user?.sub;
        return this.inventoryService.createStockAdjustment(groupId, subsidiaryId, body, createdById);
    }
    createStockTransfer(groupId, subsidiaryId, body) {
        return this.inventoryService.createStockTransfer(groupId, subsidiaryId, body);
    }
    createStockReservation(groupId, subsidiaryId, locationId, body) {
        return this.inventoryService.createStockReservation(groupId, subsidiaryId, locationId, body);
    }
};
exports.InventoryController = InventoryController;
__decorate([
    (0, permissions_decorator_1.Permissions)("inventory.stock.read"),
    (0, common_1.Get)("stock-levels"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Headers)("x-location-id")),
    __param(3, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, list_query_dto_1.ListQueryDto]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "listStockLevels", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("inventory.stock.adjust"),
    (0, common_1.Post)("stock-adjustments"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, stock_adjustment_dto_1.StockAdjustmentDto, Object]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "createStockAdjustment", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("inventory.stock.transfer"),
    (0, common_1.Post)("transfers"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, stock_transfer_dto_1.StockTransferDto]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "createStockTransfer", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("inventory.stock.reserve"),
    (0, common_1.Post)("reservations"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Headers)("x-location-id")),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, stock_reservation_dto_1.StockReservationDto]),
    __metadata("design:returntype", void 0)
], InventoryController.prototype, "createStockReservation", null);
exports.InventoryController = InventoryController = __decorate([
    (0, common_1.Controller)("v1"),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService])
], InventoryController);
//# sourceMappingURL=inventory.controller.js.map