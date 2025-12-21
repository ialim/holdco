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
exports.RolesController = void 0;
const common_1 = require("@nestjs/common");
const permissions_decorator_1 = require("../auth/permissions.decorator");
const permissions_guard_1 = require("../auth/permissions.guard");
const assign_user_role_dto_1 = require("./dto/assign-user-role.dto");
const create_role_dto_1 = require("./dto/create-role.dto");
const update_role_permissions_dto_1 = require("./dto/update-role-permissions.dto");
const roles_service_1 = require("./roles.service");
let RolesController = class RolesController {
    constructor(rolesService) {
        this.rolesService = rolesService;
    }
    async listRoles(groupId) {
        return { data: await this.rolesService.listRoles(groupId) };
    }
    createRole(groupId, body) {
        return this.rolesService.createRole({
            groupId,
            name: body.name,
            scope: body.scope,
            permissions: body.permissions,
        });
    }
    setRolePermissions(groupId, roleId, body) {
        return this.rolesService.setRolePermissions({
            groupId,
            roleId,
            permissions: body.permissions,
        });
    }
    async listPermissions() {
        return { data: await this.rolesService.listPermissions() };
    }
    assignUserRole(groupId, userId, body) {
        return this.rolesService.assignUserRole({
            groupId,
            userId,
            roleId: body.role_id,
            subsidiaryId: body.subsidiary_id,
            locationId: body.location_id,
        });
    }
};
exports.RolesController = RolesController;
__decorate([
    (0, permissions_decorator_1.Permissions)("rbac.roles.manage"),
    (0, common_1.Get)("roles"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "listRoles", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("rbac.roles.manage"),
    (0, common_1.Post)("roles"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_role_dto_1.CreateRoleDto]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "createRole", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("rbac.roles.manage"),
    (0, common_1.Post)("roles/:role_id/permissions"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Param)("role_id", new common_1.ParseUUIDPipe())),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_role_permissions_dto_1.UpdateRolePermissionsDto]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "setRolePermissions", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("rbac.permissions.read"),
    (0, common_1.Get)("permissions"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "listPermissions", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("rbac.roles.manage"),
    (0, common_1.Post)("users/:user_id/roles"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Param)("user_id", new common_1.ParseUUIDPipe())),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, assign_user_role_dto_1.AssignUserRoleDto]),
    __metadata("design:returntype", void 0)
], RolesController.prototype, "assignUserRole", null);
exports.RolesController = RolesController = __decorate([
    (0, common_1.Controller)("v1"),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })),
    __metadata("design:paramtypes", [roles_service_1.RolesService])
], RolesController);
//# sourceMappingURL=roles.controller.js.map