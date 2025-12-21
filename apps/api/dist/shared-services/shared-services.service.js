"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SharedServicesService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const shared_services_enums_1 = require("./enums/shared-services.enums");
let SharedServicesService = class SharedServicesService {
    listThirdParties(query) {
        return { data: [], meta: this.buildMeta(query) };
    }
    createThirdParty(body) {
        return {
            id: (0, crypto_1.randomUUID)(),
            status: shared_services_enums_1.ThirdPartyStatus.ACTIVE,
            ...body,
        };
    }
    listServiceRequests(query) {
        return { data: [], meta: this.buildMeta(query) };
    }
    createServiceRequest(body) {
        return {
            id: (0, crypto_1.randomUUID)(),
            status: shared_services_enums_1.ServiceRequestStatus.OPEN,
            priority: body.priority ?? shared_services_enums_1.ServiceRequestPriority.NORMAL,
            ...body,
        };
    }
    getServiceRequest(serviceRequestId) {
        return { id: serviceRequestId };
    }
    approveServiceRequest(serviceRequestId, body) {
        return {
            id: serviceRequestId,
            status: shared_services_enums_1.ServiceRequestStatus.APPROVED,
            reason: body.reason,
        };
    }
    rejectServiceRequest(serviceRequestId, body) {
        return {
            id: serviceRequestId,
            status: shared_services_enums_1.ServiceRequestStatus.REJECTED,
            reason: body.reason,
        };
    }
    assignServiceRequest(serviceRequestId, body) {
        return {
            id: serviceRequestId,
            assigned_to: body.assigned_to,
            due_at: body.due_at,
            priority: body.priority,
        };
    }
    startServiceRequest(serviceRequestId, body) {
        return {
            id: serviceRequestId,
            status: shared_services_enums_1.ServiceRequestStatus.IN_PROGRESS,
            reason: body.reason,
        };
    }
    completeServiceRequest(serviceRequestId, body) {
        return {
            id: serviceRequestId,
            status: shared_services_enums_1.ServiceRequestStatus.COMPLETED,
            reason: body.reason,
        };
    }
    cancelServiceRequest(serviceRequestId, body) {
        return {
            id: serviceRequestId,
            status: shared_services_enums_1.ServiceRequestStatus.CANCELLED,
            reason: body.reason,
        };
    }
    buildMeta(query) {
        return {
            limit: query.limit ?? 50,
            offset: query.offset ?? 0,
            total: 0,
        };
    }
};
exports.SharedServicesService = SharedServicesService;
exports.SharedServicesService = SharedServicesService = __decorate([
    (0, common_1.Injectable)()
], SharedServicesService);
//# sourceMappingURL=shared-services.service.js.map