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
exports.TenancyController = void 0;
const common_1 = require("@nestjs/common");
const permissions_decorator_1 = require("../auth/permissions.decorator");
const permissions_guard_1 = require("../auth/permissions.guard");
const list_query_dto_1 = require("./dto/list-query.dto");
const tenancy_service_1 = require("./tenancy.service");
let TenancyController = class TenancyController {
    constructor(tenancyService) {
        this.tenancyService = tenancyService;
    }
    listTenants(req, groupId) {
        const headerGroupId = groupId;
        const tokenGroupId = req.user?.groupId ?? req.user?.group_id;
        return this.tenancyService.listTenants(headerGroupId ?? tokenGroupId);
    }
    listUsers(groupId, subsidiaryId, query) {
        return this.tenancyService.listUsers({
            groupId,
            subsidiaryId,
            limit: query.limit ?? 50,
            offset: query.offset ?? 0,
        });
    }
};
exports.TenancyController = TenancyController;
__decorate([
    (0, permissions_decorator_1.Permissions)("tenancy.read"),
    (0, common_1.Get)("tenants"),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)("x-group-id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], TenancyController.prototype, "listTenants", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("tenancy.users.read"),
    (0, common_1.Get)("users"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, list_query_dto_1.ListQueryDto]),
    __metadata("design:returntype", void 0)
], TenancyController.prototype, "listUsers", null);
exports.TenancyController = TenancyController = __decorate([
    (0, common_1.Controller)("v1"),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })),
    __metadata("design:paramtypes", [tenancy_service_1.TenancyService])
], TenancyController);
//# sourceMappingURL=tenancy.controller.js.map