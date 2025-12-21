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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let RolesService = class RolesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listRoles(groupId) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        const roles = await this.prisma.role.findMany({
            where: { groupId },
            include: { rolePermissions: { include: { permission: true } } },
            orderBy: { name: "asc" },
        });
        return roles.map((role) => ({
            id: role.id,
            name: role.name,
            scope: role.scope,
            permissions: role.rolePermissions.map((rp) => rp.permission.code),
        }));
    }
    async listPermissions() {
        const permissions = await this.prisma.permission.findMany({ orderBy: { code: "asc" } });
        return permissions.map((permission) => ({
            id: permission.id,
            code: permission.code,
            description: permission.description,
        }));
    }
    async createRole(params) {
        const { groupId, name, scope, permissions } = params;
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        const permissionIds = await this.ensurePermissions(permissions);
        const role = await this.prisma.role.create({
            data: {
                groupId,
                name,
                scope,
                rolePermissions: {
                    create: permissionIds.map((permissionId) => ({ permissionId })),
                },
            },
        });
        return this.getRole(role.id);
    }
    async setRolePermissions(params) {
        const { groupId, roleId, permissions } = params;
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        const role = await this.prisma.role.findFirst({ where: { id: roleId, groupId } });
        if (!role)
            throw new common_1.NotFoundException("Role not found");
        const permissionIds = await this.ensurePermissions(permissions);
        await this.prisma.rolePermission.deleteMany({ where: { roleId } });
        if (permissionIds.length) {
            await this.prisma.rolePermission.createMany({
                data: permissionIds.map((permissionId) => ({ roleId, permissionId })),
            });
        }
        return this.getRole(roleId);
    }
    async assignUserRole(params) {
        const { groupId, userId, roleId, subsidiaryId, locationId } = params;
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        const user = await this.prisma.user.findFirst({ where: { id: userId, groupId } });
        if (!user)
            throw new common_1.NotFoundException("User not found");
        const role = await this.prisma.role.findFirst({ where: { id: roleId, groupId } });
        if (!role)
            throw new common_1.NotFoundException("Role not found");
        if (subsidiaryId) {
            const subsidiary = await this.prisma.subsidiary.findFirst({ where: { id: subsidiaryId, groupId } });
            if (!subsidiary)
                throw new common_1.NotFoundException("Subsidiary not found");
        }
        if (locationId) {
            const location = await this.prisma.location.findFirst({ where: { id: locationId, groupId } });
            if (!location)
                throw new common_1.NotFoundException("Location not found");
            if (subsidiaryId && location.subsidiaryId !== subsidiaryId) {
                throw new common_1.BadRequestException("Location does not belong to subsidiary");
            }
        }
        const existing = await this.prisma.userRole.findFirst({
            where: {
                userId,
                roleId,
                subsidiaryId: subsidiaryId ?? null,
                locationId: locationId ?? null,
            },
        });
        if (existing) {
            return {
                id: existing.id,
                user_id: existing.userId,
                role_id: existing.roleId,
                subsidiary_id: existing.subsidiaryId,
                location_id: existing.locationId,
                created_at: existing.createdAt,
            };
        }
        const userRole = await this.prisma.userRole.create({
            data: {
                userId,
                roleId,
                subsidiaryId,
                locationId,
            },
        });
        return {
            id: userRole.id,
            user_id: userRole.userId,
            role_id: userRole.roleId,
            subsidiary_id: userRole.subsidiaryId,
            location_id: userRole.locationId,
            created_at: userRole.createdAt,
        };
    }
    async getRole(roleId) {
        const role = await this.prisma.role.findUnique({
            where: { id: roleId },
            include: { rolePermissions: { include: { permission: true } } },
        });
        if (!role)
            throw new common_1.NotFoundException("Role not found");
        return {
            id: role.id,
            name: role.name,
            scope: role.scope,
            permissions: role.rolePermissions.map((rp) => rp.permission.code),
        };
    }
    async ensurePermissions(codes) {
        const normalized = Array.from(new Set(codes
            .map((code) => code.trim())
            .filter((code) => code.length > 0)));
        if (!normalized.length) {
            return [];
        }
        const permissions = await Promise.all(normalized.map((code) => this.prisma.permission.upsert({
            where: { code },
            update: {},
            create: { code },
        })));
        return permissions.map((permission) => permission.id);
    }
};
exports.RolesService = RolesService;
exports.RolesService = RolesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RolesService);
//# sourceMappingURL=roles.service.js.map