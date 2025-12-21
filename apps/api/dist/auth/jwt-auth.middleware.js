"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtAuthMiddleware = void 0;
const common_1 = require("@nestjs/common");
const jsonwebtoken_1 = require("jsonwebtoken");
const permissions_mapper_1 = require("./permissions.mapper");
let JwtAuthMiddleware = class JwtAuthMiddleware {
    use(req, _res, next) {
        const header = req.headers?.authorization;
        if (!header) {
            return next();
        }
        const [scheme, token] = header.split(" ");
        if (scheme !== "Bearer" || !token) {
            throw new common_1.UnauthorizedException("Invalid authorization header");
        }
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new common_1.UnauthorizedException("JWT secret not configured");
        }
        try {
            const payload = (0, jsonwebtoken_1.verify)(token, secret);
            const user = typeof payload === "string" ? { sub: payload } : payload;
            const permissions = Array.isArray(user.permissions) ? user.permissions : [];
            const roles = Array.isArray(user.roles) ? user.roles : [];
            req.user = {
                ...user,
                permissions: permissions.length ? permissions : (0, permissions_mapper_1.mapRolesToPermissions)(roles),
            };
        }
        catch (error) {
            throw new common_1.UnauthorizedException("Invalid token");
        }
        return next();
    }
};
exports.JwtAuthMiddleware = JwtAuthMiddleware;
exports.JwtAuthMiddleware = JwtAuthMiddleware = __decorate([
    (0, common_1.Injectable)()
], JwtAuthMiddleware);
//# sourceMappingURL=jwt-auth.middleware.js.map