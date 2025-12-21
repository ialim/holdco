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
exports.LogisticsController = void 0;
const common_1 = require("@nestjs/common");
const permissions_decorator_1 = require("../auth/permissions.decorator");
const permissions_guard_1 = require("../auth/permissions.guard");
const list_query_dto_1 = require("../common/dto/list-query.dto");
const create_shipment_dto_1 = require("./dto/create-shipment.dto");
const logistics_service_1 = require("./logistics.service");
let LogisticsController = class LogisticsController {
    constructor(logisticsService) {
        this.logisticsService = logisticsService;
    }
    listShipments(groupId, subsidiaryId, query) {
        return this.logisticsService.listShipments(groupId, subsidiaryId, query);
    }
    createShipment(groupId, subsidiaryId, body) {
        return this.logisticsService.createShipment(groupId, subsidiaryId, body);
    }
    getShipment(groupId, subsidiaryId, shipmentId) {
        return this.logisticsService.getShipment(groupId, subsidiaryId, shipmentId);
    }
};
exports.LogisticsController = LogisticsController;
__decorate([
    (0, permissions_decorator_1.Permissions)("logistics.shipment.read"),
    (0, common_1.Get)("shipments"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, list_query_dto_1.ListQueryDto]),
    __metadata("design:returntype", void 0)
], LogisticsController.prototype, "listShipments", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("logistics.shipment.write"),
    (0, common_1.Post)("shipments"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_shipment_dto_1.CreateShipmentDto]),
    __metadata("design:returntype", void 0)
], LogisticsController.prototype, "createShipment", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("logistics.shipment.read"),
    (0, common_1.Get)("shipments/:shipment_id"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Param)("shipment_id", new common_1.ParseUUIDPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], LogisticsController.prototype, "getShipment", null);
exports.LogisticsController = LogisticsController = __decorate([
    (0, common_1.Controller)("v1"),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })),
    __metadata("design:paramtypes", [logistics_service_1.LogisticsService])
], LogisticsController);
//# sourceMappingURL=logistics.controller.js.map