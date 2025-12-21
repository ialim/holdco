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
exports.ComplianceController = void 0;
const common_1 = require("@nestjs/common");
const permissions_decorator_1 = require("../auth/permissions.decorator");
const permissions_guard_1 = require("../auth/permissions.guard");
const list_query_dto_1 = require("../common/dto/list-query.dto");
const compliance_service_1 = require("./compliance.service");
const create_compliance_policy_dto_1 = require("./dto/create-compliance-policy.dto");
const create_compliance_task_dto_1 = require("./dto/create-compliance-task.dto");
const create_risk_register_dto_1 = require("./dto/create-risk-register.dto");
const create_compliance_audit_dto_1 = require("./dto/create-compliance-audit.dto");
let ComplianceController = class ComplianceController {
    constructor(complianceService) {
        this.complianceService = complianceService;
    }
    listPolicies(groupId, subsidiaryId, query) {
        return this.complianceService.listPolicies(groupId, subsidiaryId, query);
    }
    createPolicy(groupId, subsidiaryId, body) {
        return this.complianceService.createPolicy(groupId, subsidiaryId, body);
    }
    listTasks(groupId, subsidiaryId, query) {
        return this.complianceService.listTasks(groupId, subsidiaryId, query);
    }
    createTask(groupId, subsidiaryId, body) {
        return this.complianceService.createTask(groupId, subsidiaryId, body);
    }
    listRisks(groupId, subsidiaryId, query) {
        return this.complianceService.listRisks(groupId, subsidiaryId, query);
    }
    createRisk(groupId, subsidiaryId, body) {
        return this.complianceService.createRisk(groupId, subsidiaryId, body);
    }
    listAudits(groupId, subsidiaryId, query) {
        return this.complianceService.listAudits(groupId, subsidiaryId, query);
    }
    createAudit(groupId, subsidiaryId, body) {
        return this.complianceService.createAudit(groupId, subsidiaryId, body);
    }
};
exports.ComplianceController = ComplianceController;
__decorate([
    (0, permissions_decorator_1.Permissions)("compliance.policy.manage"),
    (0, common_1.Get)("compliance/policies"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, list_query_dto_1.ListQueryDto]),
    __metadata("design:returntype", void 0)
], ComplianceController.prototype, "listPolicies", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("compliance.policy.manage"),
    (0, common_1.Post)("compliance/policies"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_compliance_policy_dto_1.CreateCompliancePolicyDto]),
    __metadata("design:returntype", void 0)
], ComplianceController.prototype, "createPolicy", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("compliance.task.manage"),
    (0, common_1.Get)("compliance/tasks"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, list_query_dto_1.ListQueryDto]),
    __metadata("design:returntype", void 0)
], ComplianceController.prototype, "listTasks", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("compliance.task.manage"),
    (0, common_1.Post)("compliance/tasks"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_compliance_task_dto_1.CreateComplianceTaskDto]),
    __metadata("design:returntype", void 0)
], ComplianceController.prototype, "createTask", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("compliance.risk.manage"),
    (0, common_1.Get)("compliance/risks"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, list_query_dto_1.ListQueryDto]),
    __metadata("design:returntype", void 0)
], ComplianceController.prototype, "listRisks", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("compliance.risk.manage"),
    (0, common_1.Post)("compliance/risks"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_risk_register_dto_1.CreateRiskRegisterItemDto]),
    __metadata("design:returntype", void 0)
], ComplianceController.prototype, "createRisk", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("compliance.audit.manage"),
    (0, common_1.Get)("compliance/audits"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, list_query_dto_1.ListQueryDto]),
    __metadata("design:returntype", void 0)
], ComplianceController.prototype, "listAudits", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("compliance.audit.manage"),
    (0, common_1.Post)("compliance/audits"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_compliance_audit_dto_1.CreateComplianceAuditDto]),
    __metadata("design:returntype", void 0)
], ComplianceController.prototype, "createAudit", null);
exports.ComplianceController = ComplianceController = __decorate([
    (0, common_1.Controller)("v1"),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })),
    __metadata("design:paramtypes", [compliance_service_1.ComplianceService])
], ComplianceController);
//# sourceMappingURL=compliance.controller.js.map