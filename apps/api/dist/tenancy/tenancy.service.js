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
exports.TenancyService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TenancyService = class TenancyService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listTenants(groupId) {
        if (!groupId) {
            throw new common_1.BadRequestException("Group id is required");
        }
        const subsidiaries = await this.prisma.subsidiary.findMany({
            where: { groupId },
            orderBy: { name: "asc" },
        });
        return subsidiaries.map((subsidiary) => ({
            id: subsidiary.id,
            name: subsidiary.name,
            status: subsidiary.status,
        }));
    }
    async listUsers(params) {
        const { groupId, subsidiaryId, limit, offset } = params;
        const where = {
            groupId,
            userRoles: {
                some: {
                    subsidiaryId,
                },
            },
        };
        const [total, users] = await this.prisma.$transaction([
            this.prisma.user.count({ where }),
            this.prisma.user.findMany({
                where,
                orderBy: { email: "asc" },
                skip: offset,
                take: limit,
                include: {
                    userRoles: {
                        include: {
                            role: {
                                include: {
                                    rolePermissions: {
                                        include: { permission: true },
                                    },
                                },
                            },
                        },
                    },
                },
            }),
        ]);
        const data = users.map((user) => {
            const roles = user.userRoles.map((userRole) => userRole.role.name);
            const permissions = new Set();
            for (const userRole of user.userRoles) {
                for (const rolePermission of userRole.role.rolePermissions) {
                    permissions.add(rolePermission.permission.code);
                }
            }
            return {
                id: user.id,
                email: user.email,
                name: user.name,
                roles,
                permissions: Array.from(permissions),
            };
        });
        return {
            data,
            meta: {
                limit,
                offset,
                total,
            },
        };
    }
};
exports.TenancyService = TenancyService;
exports.TenancyService = TenancyService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TenancyService);
//# sourceMappingURL=tenancy.service.js.map