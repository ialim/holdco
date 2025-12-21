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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const jsonwebtoken_1 = require("jsonwebtoken");
const crypto_1 = require("crypto");
let AuthController = class AuthController {
    login(body) {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new common_1.BadRequestException("JWT_SECRET is not configured");
        }
        const userId = (0, crypto_1.randomUUID)();
        const payload = {
            sub: userId,
            email: body?.email,
            roles: [],
            permissions: [],
        };
        const accessToken = (0, jsonwebtoken_1.sign)(payload, secret, { expiresIn: "1h" });
        return {
            access_token: accessToken,
            expires_in: 3600,
            user: {
                id: userId,
                email: body?.email,
                name: "",
                roles: [],
                permissions: [],
            },
        };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)("login"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "login", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)("v1/auth"),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
], AuthController);
//# sourceMappingURL=auth.controller.js.map