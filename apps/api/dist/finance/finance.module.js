"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../prisma/prisma.module");
const finance_controller_1 = require("./finance.controller");
const cost_pool_service_1 = require("./cost-pool.service");
const intercompany_invoicing_service_1 = require("./intercompany-invoicing.service");
const payments_service_1 = require("./payments.service");
const tax_service_1 = require("./tax.service");
const period_lock_service_1 = require("./period-lock.service");
const month_close_service_1 = require("./month-close.service");
const wht_remittance_service_1 = require("./wht-remittance.service");
const credit_note_service_1 = require("./credit-note.service");
const tax_impact_service_1 = require("./tax-impact.service");
const consolidated_pl_service_1 = require("./consolidated-pl.service");
const ledger_posting_service_1 = require("./ledger-posting.service");
let FinanceModule = class FinanceModule {
};
exports.FinanceModule = FinanceModule;
exports.FinanceModule = FinanceModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [finance_controller_1.FinanceController],
        providers: [
            cost_pool_service_1.CostPoolService,
            ledger_posting_service_1.LedgerPostingService,
            intercompany_invoicing_service_1.IntercompanyInvoicingService,
            payments_service_1.PaymentsService,
            tax_service_1.TaxService,
            period_lock_service_1.PeriodLockService,
            month_close_service_1.MonthCloseService,
            wht_remittance_service_1.WhtRemittanceService,
            credit_note_service_1.CreditNoteService,
            tax_impact_service_1.TaxImpactService,
            consolidated_pl_service_1.ConsolidatedPLService,
        ],
        exports: [
            cost_pool_service_1.CostPoolService,
            ledger_posting_service_1.LedgerPostingService,
            intercompany_invoicing_service_1.IntercompanyInvoicingService,
            payments_service_1.PaymentsService,
            tax_service_1.TaxService,
            period_lock_service_1.PeriodLockService,
            month_close_service_1.MonthCloseService,
            wht_remittance_service_1.WhtRemittanceService,
            credit_note_service_1.CreditNoteService,
            tax_impact_service_1.TaxImpactService,
            consolidated_pl_service_1.ConsolidatedPLService,
        ],
    })
], FinanceModule);
//# sourceMappingURL=finance.module.js.map