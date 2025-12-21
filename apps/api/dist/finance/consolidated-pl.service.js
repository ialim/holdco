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
exports.ConsolidatedPLService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const library_1 = require("@prisma/client/runtime/library");
const finance_enums_1 = require("./finance.enums");
function dec(v) { return new library_1.Decimal(v); }
function round2(d) { return new library_1.Decimal(d.toFixed(2)); }
let ConsolidatedPLService = class ConsolidatedPLService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async consolidatedPL(params) {
        const excludeIC = params.excludeIntercompanyAccounts ?? true;
        const entries = await this.prisma.ledgerEntry.findMany({
            where: { period: params.period },
            include: { account: true },
        });
        const filtered = excludeIC
            ? entries.filter((e) => !["IC_REV", "IC_EXP"].includes(e.account.code))
            : entries;
        let revenue = dec(0);
        let cogs = dec(0);
        let expense = dec(0);
        for (const e of filtered) {
            const amount = dec(e.credit).minus(dec(e.debit));
            if (e.account.type === finance_enums_1.LedgerAccountType.REVENUE)
                revenue = revenue.plus(amount);
            if (e.account.type === finance_enums_1.LedgerAccountType.COGS)
                cogs = cogs.plus(amount.abs());
            if (e.account.type === finance_enums_1.LedgerAccountType.EXPENSE)
                expense = expense.plus(amount.abs());
        }
        revenue = round2(revenue);
        cogs = round2(cogs);
        expense = round2(expense);
        const grossProfit = round2(revenue.minus(cogs));
        const netProfit = round2(grossProfit.minus(expense));
        return { period: params.period, revenue: revenue.toString(), cogs: cogs.toString(), grossProfit: grossProfit.toString(), operatingExpenses: expense.toString(), netProfit: netProfit.toString(), note: excludeIC ? "Intercompany accounts (IC_REV, IC_EXP) excluded." : "Includes intercompany accounts." };
    }
};
exports.ConsolidatedPLService = ConsolidatedPLService;
exports.ConsolidatedPLService = ConsolidatedPLService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ConsolidatedPLService);
//# sourceMappingURL=consolidated-pl.service.js.map