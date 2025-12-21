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
exports.HrController = void 0;
const common_1 = require("@nestjs/common");
const permissions_decorator_1 = require("../auth/permissions.decorator");
const permissions_guard_1 = require("../auth/permissions.guard");
const list_query_dto_1 = require("../common/dto/list-query.dto");
const hr_service_1 = require("./hr.service");
const create_department_dto_1 = require("./dto/create-department.dto");
const create_position_dto_1 = require("./dto/create-position.dto");
const create_employee_dto_1 = require("./dto/create-employee.dto");
const create_leave_request_dto_1 = require("./dto/create-leave-request.dto");
let HrController = class HrController {
    constructor(hrService) {
        this.hrService = hrService;
    }
    listDepartments(groupId, subsidiaryId, query) {
        return this.hrService.listDepartments(groupId, subsidiaryId, query);
    }
    createDepartment(groupId, subsidiaryId, body) {
        return this.hrService.createDepartment(groupId, subsidiaryId, body);
    }
    listPositions(groupId, subsidiaryId, query) {
        return this.hrService.listPositions(groupId, subsidiaryId, query);
    }
    createPosition(groupId, subsidiaryId, body) {
        return this.hrService.createPosition(groupId, subsidiaryId, body);
    }
    listEmployees(groupId, subsidiaryId, query) {
        return this.hrService.listEmployees(groupId, subsidiaryId, query);
    }
    createEmployee(groupId, subsidiaryId, body) {
        return this.hrService.createEmployee(groupId, subsidiaryId, body);
    }
    listLeaveRequests(groupId, subsidiaryId, query) {
        return this.hrService.listLeaveRequests(groupId, subsidiaryId, query);
    }
    createLeaveRequest(groupId, subsidiaryId, body) {
        return this.hrService.createLeaveRequest(groupId, subsidiaryId, body);
    }
};
exports.HrController = HrController;
__decorate([
    (0, permissions_decorator_1.Permissions)("hr.department.manage"),
    (0, common_1.Get)("hr/departments"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, list_query_dto_1.ListQueryDto]),
    __metadata("design:returntype", void 0)
], HrController.prototype, "listDepartments", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("hr.department.manage"),
    (0, common_1.Post)("hr/departments"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_department_dto_1.CreateDepartmentDto]),
    __metadata("design:returntype", void 0)
], HrController.prototype, "createDepartment", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("hr.position.manage"),
    (0, common_1.Get)("hr/positions"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, list_query_dto_1.ListQueryDto]),
    __metadata("design:returntype", void 0)
], HrController.prototype, "listPositions", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("hr.position.manage"),
    (0, common_1.Post)("hr/positions"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_position_dto_1.CreatePositionDto]),
    __metadata("design:returntype", void 0)
], HrController.prototype, "createPosition", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("hr.employee.manage"),
    (0, common_1.Get)("hr/employees"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, list_query_dto_1.ListQueryDto]),
    __metadata("design:returntype", void 0)
], HrController.prototype, "listEmployees", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("hr.employee.manage"),
    (0, common_1.Post)("hr/employees"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_employee_dto_1.CreateEmployeeDto]),
    __metadata("design:returntype", void 0)
], HrController.prototype, "createEmployee", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("hr.leave.manage"),
    (0, common_1.Get)("hr/leave-requests"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, list_query_dto_1.ListQueryDto]),
    __metadata("design:returntype", void 0)
], HrController.prototype, "listLeaveRequests", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("hr.leave.manage"),
    (0, common_1.Post)("hr/leave-requests"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_leave_request_dto_1.CreateLeaveRequestDto]),
    __metadata("design:returntype", void 0)
], HrController.prototype, "createLeaveRequest", null);
exports.HrController = HrController = __decorate([
    (0, common_1.Controller)("v1"),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })),
    __metadata("design:paramtypes", [hr_service_1.HrService])
], HrController);
//# sourceMappingURL=hr.controller.js.map