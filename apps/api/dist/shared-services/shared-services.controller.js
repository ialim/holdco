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
exports.SharedServicesController = void 0;
const common_1 = require("@nestjs/common");
const permissions_decorator_1 = require("../auth/permissions.decorator");
const permissions_guard_1 = require("../auth/permissions.guard");
const create_service_request_dto_1 = require("./dto/create-service-request.dto");
const create_third_party_dto_1 = require("./dto/create-third-party.dto");
const list_query_dto_1 = require("./dto/list-query.dto");
const service_request_action_dto_1 = require("./dto/service-request-action.dto");
const service_request_assign_dto_1 = require("./dto/service-request-assign.dto");
const shared_services_service_1 = require("./shared-services.service");
let SharedServicesController = class SharedServicesController {
    constructor(sharedServicesService) {
        this.sharedServicesService = sharedServicesService;
    }
    listThirdParties(query) {
        return this.sharedServicesService.listThirdParties(query);
    }
    createThirdParty(body) {
        return this.sharedServicesService.createThirdParty(body);
    }
    listServiceRequests(query) {
        return this.sharedServicesService.listServiceRequests(query);
    }
    createServiceRequest(body) {
        return this.sharedServicesService.createServiceRequest(body);
    }
    getServiceRequest(serviceRequestId) {
        return this.sharedServicesService.getServiceRequest(serviceRequestId);
    }
    approveServiceRequest(serviceRequestId, body) {
        return this.sharedServicesService.approveServiceRequest(serviceRequestId, body);
    }
    rejectServiceRequest(serviceRequestId, body) {
        return this.sharedServicesService.rejectServiceRequest(serviceRequestId, body);
    }
    assignServiceRequest(serviceRequestId, body) {
        return this.sharedServicesService.assignServiceRequest(serviceRequestId, body);
    }
    startServiceRequest(serviceRequestId, body) {
        return this.sharedServicesService.startServiceRequest(serviceRequestId, body);
    }
    completeServiceRequest(serviceRequestId, body) {
        return this.sharedServicesService.completeServiceRequest(serviceRequestId, body);
    }
    cancelServiceRequest(serviceRequestId, body) {
        return this.sharedServicesService.cancelServiceRequest(serviceRequestId, body);
    }
};
exports.SharedServicesController = SharedServicesController;
__decorate([
    (0, permissions_decorator_1.Permissions)("shared_services.third_party.read"),
    (0, common_1.Get)("third-parties"),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_query_dto_1.ListQueryDto]),
    __metadata("design:returntype", void 0)
], SharedServicesController.prototype, "listThirdParties", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("shared_services.third_party.write"),
    (0, common_1.Post)("third-parties"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_third_party_dto_1.CreateThirdPartyDto]),
    __metadata("design:returntype", void 0)
], SharedServicesController.prototype, "createThirdParty", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("shared_services.request.read"),
    (0, common_1.Get)("shared-services/requests"),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_query_dto_1.ListQueryDto]),
    __metadata("design:returntype", void 0)
], SharedServicesController.prototype, "listServiceRequests", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("shared_services.request.create"),
    (0, common_1.Post)("shared-services/requests"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_service_request_dto_1.CreateServiceRequestDto]),
    __metadata("design:returntype", void 0)
], SharedServicesController.prototype, "createServiceRequest", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("shared_services.request.read"),
    (0, common_1.Get)("shared-services/requests/:service_request_id"),
    __param(0, (0, common_1.Param)("service_request_id", new common_1.ParseUUIDPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SharedServicesController.prototype, "getServiceRequest", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("shared_services.request.approve"),
    (0, common_1.Post)("shared-services/requests/:service_request_id/approve"),
    __param(0, (0, common_1.Param)("service_request_id", new common_1.ParseUUIDPipe())),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, service_request_action_dto_1.ServiceRequestActionDto]),
    __metadata("design:returntype", void 0)
], SharedServicesController.prototype, "approveServiceRequest", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("shared_services.request.reject"),
    (0, common_1.Post)("shared-services/requests/:service_request_id/reject"),
    __param(0, (0, common_1.Param)("service_request_id", new common_1.ParseUUIDPipe())),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, service_request_action_dto_1.ServiceRequestActionDto]),
    __metadata("design:returntype", void 0)
], SharedServicesController.prototype, "rejectServiceRequest", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("shared_services.request.assign"),
    (0, common_1.Post)("shared-services/requests/:service_request_id/assign"),
    __param(0, (0, common_1.Param)("service_request_id", new common_1.ParseUUIDPipe())),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, service_request_assign_dto_1.ServiceRequestAssignDto]),
    __metadata("design:returntype", void 0)
], SharedServicesController.prototype, "assignServiceRequest", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("shared_services.request.start"),
    (0, common_1.Post)("shared-services/requests/:service_request_id/start"),
    __param(0, (0, common_1.Param)("service_request_id", new common_1.ParseUUIDPipe())),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, service_request_action_dto_1.ServiceRequestActionDto]),
    __metadata("design:returntype", void 0)
], SharedServicesController.prototype, "startServiceRequest", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("shared_services.request.complete"),
    (0, common_1.Post)("shared-services/requests/:service_request_id/complete"),
    __param(0, (0, common_1.Param)("service_request_id", new common_1.ParseUUIDPipe())),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, service_request_action_dto_1.ServiceRequestActionDto]),
    __metadata("design:returntype", void 0)
], SharedServicesController.prototype, "completeServiceRequest", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("shared_services.request.cancel"),
    (0, common_1.Post)("shared-services/requests/:service_request_id/cancel"),
    __param(0, (0, common_1.Param)("service_request_id", new common_1.ParseUUIDPipe())),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, service_request_action_dto_1.ServiceRequestActionDto]),
    __metadata("design:returntype", void 0)
], SharedServicesController.prototype, "cancelServiceRequest", null);
exports.SharedServicesController = SharedServicesController = __decorate([
    (0, common_1.Controller)("v1"),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })),
    __metadata("design:paramtypes", [shared_services_service_1.SharedServicesService])
], SharedServicesController);
//# sourceMappingURL=shared-services.controller.js.map