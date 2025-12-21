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
exports.MonthCloseService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const cost_pool_service_1 = require("./cost-pool.service");
const intercompany_invoicing_service_1 = require("./intercompany-invoicing.service");
const period_lock_service_1 = require("./period-lock.service");
const finance_enums_1 = require("./finance.enums");
let MonthCloseService = class MonthCloseService {
    constructor(prisma, costPoolService, invoicingService, periodLockService) {
        this.prisma = prisma;
        this.costPoolService = costPoolService;
        this.invoicingService = invoicingService;
        this.periodLockService = periodLockService;
    }
    async runMonthClose(params) {
        await this.periodLockService.assertNotLocked(params.holdcoCompanyId, params.period);
        const cp = await this.costPoolService.createCostPool({
            holdcoCompanyId: params.holdcoCompanyId,
            period: params.period,
            lines: params.lines,
            allocationMethod: finance_enums_1.AllocationMethod.BY_FIXED_SPLIT,
            weights: params.weights,
        });
        await this.costPoolService.allocateCostPool(cp.costPoolId);
        const inv = await this.invoicingService.generateIntercompanyInvoices({
            holdcoCompanyId: params.holdcoCompanyId,
            period: params.period,
            issueDate: params.issueDate,
            dueDays: params.dueDays ?? 30,
        });
        await this.periodLockService.lockPeriod({
            companyId: params.holdcoCompanyId,
            period: params.period,
            lockedBy: params.lockedBy,
            reason: "Month close completed: cost pool, allocations, invoices generated.",
        });
        return { costPool: cp, invoices: inv, locked: true };
    }
};
exports.MonthCloseService = MonthCloseService;
exports.MonthCloseService = MonthCloseService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cost_pool_service_1.CostPoolService,
        intercompany_invoicing_service_1.IntercompanyInvoicingService,
        period_lock_service_1.PeriodLockService])
], MonthCloseService);
//# sourceMappingURL=month-close.service.js.map