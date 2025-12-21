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
exports.PeriodLockService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PeriodLockService = class PeriodLockService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async assertNotLocked(companyId, period) {
        const lock = await this.prisma.periodLock.findUnique({
            where: { companyId_period: { companyId, period } },
        });
        if (lock?.locked)
            throw new common_1.BadRequestException(`Period ${period} is locked for company ${companyId}`);
    }
    async lockPeriod(params) {
        return this.prisma.periodLock.upsert({
            where: { companyId_period: { companyId: params.companyId, period: params.period } },
            update: { locked: true, lockedAt: new Date(), lockedBy: params.lockedBy, reason: params.reason },
            create: { companyId: params.companyId, period: params.period, locked: true, lockedAt: new Date(), lockedBy: params.lockedBy, reason: params.reason },
        });
    }
    async unlockPeriod(params) {
        return this.prisma.periodLock.upsert({
            where: { companyId_period: { companyId: params.companyId, period: params.period } },
            update: { locked: false, lockedAt: null, lockedBy: params.lockedBy, reason: params.reason },
            create: { companyId: params.companyId, period: params.period, locked: false, lockedAt: null, lockedBy: params.lockedBy, reason: params.reason },
        });
    }
};
exports.PeriodLockService = PeriodLockService;
exports.PeriodLockService = PeriodLockService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PeriodLockService);
//# sourceMappingURL=period-lock.service.js.map