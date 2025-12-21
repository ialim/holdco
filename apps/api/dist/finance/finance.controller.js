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
exports.FinanceController = void 0;
const common_1 = require("@nestjs/common");
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
const permissions_decorator_1 = require("../auth/permissions.decorator");
const permissions_guard_1 = require("../auth/permissions.guard");
let FinanceController = class FinanceController {
    constructor(costPoolService, invoicingService, paymentsService, taxService, periodLockService, monthCloseService, whtRemittanceService, creditNoteService, taxImpactService, consolidatedPLService, ledgerPostingService) {
        this.costPoolService = costPoolService;
        this.invoicingService = invoicingService;
        this.paymentsService = paymentsService;
        this.taxService = taxService;
        this.periodLockService = periodLockService;
        this.monthCloseService = monthCloseService;
        this.whtRemittanceService = whtRemittanceService;
        this.creditNoteService = creditNoteService;
        this.taxImpactService = taxImpactService;
        this.consolidatedPLService = consolidatedPLService;
        this.ledgerPostingService = ledgerPostingService;
    }
    monthClose(body) {
        return this.monthCloseService.runMonthClose({
            holdcoCompanyId: body.holdcoCompanyId,
            period: body.period,
            issueDate: new Date(body.issueDate),
            dueDays: body.dueDays ?? 30,
            lines: body.lines,
            weights: body.weights,
            lockedBy: body.lockedBy,
        });
    }
    createCostPool(body) {
        return this.costPoolService.createCostPool(body);
    }
    allocate(id) {
        return this.costPoolService.allocateCostPool(id);
    }
    generate(period, body) {
        return this.invoicingService.generateIntercompanyInvoices({
            holdcoCompanyId: body.holdcoCompanyId,
            period,
            issueDate: new Date(body.issueDate),
            dueDays: body.dueDays ?? 30,
        });
    }
    issueInvoice(id) {
        return this.invoicingService.issueInvoice(id);
    }
    postPeriod(body) {
        return this.ledgerPostingService.postAllInvoicesForPeriod({ period: body.period });
    }
    recordPayment(body) {
        return this.paymentsService.recordIntercompanyPayment({
            invoiceId: body.invoiceId,
            paymentDate: new Date(body.paymentDate),
            amountPaid: body.amountPaid,
            whtWithheldAmount: body.whtWithheldAmount,
            reference: body.reference,
            notes: body.notes,
        });
    }
    whtSchedule(issuerCompanyId, period) {
        return this.whtRemittanceService.getWhtSchedule({ issuerCompanyId, period });
    }
    whtRemit(body) {
        return this.whtRemittanceService.markRemitted({
            issuerCompanyId: body.issuerCompanyId,
            period: body.period,
            taxType: body.taxType,
            remittanceDate: new Date(body.remittanceDate),
            firReceiptRef: body.firReceiptRef,
        });
    }
    vat(companyId, period) {
        return this.taxService.generateVatReturn({ companyId, period });
    }
    fileVat(body) {
        return this.taxService.fileVatReturn({ companyId: body.companyId, period: body.period, paymentRef: body.paymentRef });
    }
    lock(body) {
        return this.periodLockService.lockPeriod(body);
    }
    unlock(body) {
        return this.periodLockService.unlockPeriod(body);
    }
    createCredit(body) {
        return this.creditNoteService.createCreditNote({
            originalInvoiceId: body.originalInvoiceId,
            issueDate: new Date(body.issueDate),
            reason: body.reason,
            fullReversal: body.fullReversal,
            lines: body.lines,
        });
    }
    taxImpact(companyId, period) {
        return this.taxImpactService.companyTaxImpact({ companyId, period });
    }
    consolidatedPL(period) {
        return this.consolidatedPLService.consolidatedPL({ period, excludeIntercompanyAccounts: true });
    }
};
exports.FinanceController = FinanceController;
__decorate([
    (0, permissions_decorator_1.Permissions)("finance.month_close.run"),
    (0, common_1.Post)("month-close"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "monthClose", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("finance.cost_pools.manage"),
    (0, common_1.Post)("cost-pools"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "createCostPool", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("finance.cost_pools.manage"),
    (0, common_1.Post)("cost-pools/:id/allocate"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "allocate", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("finance.intercompany.generate"),
    (0, common_1.Post)("intercompany/:period/generate"),
    __param(0, (0, common_1.Param)("period")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "generate", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("finance.invoices.issue"),
    (0, common_1.Post)("invoices/:id/issue"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "issueInvoice", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("finance.ledger.post"),
    (0, common_1.Post)("ledger/post-period"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "postPeriod", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("finance.payments.record"),
    (0, common_1.Post)("payments/intercompany"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "recordPayment", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("finance.wht.schedule.read"),
    (0, common_1.Get)("wht-schedule/:issuerCompanyId/:period"),
    __param(0, (0, common_1.Param)("issuerCompanyId")),
    __param(1, (0, common_1.Param)("period")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "whtSchedule", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("finance.wht.remit"),
    (0, common_1.Post)("wht-remit"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "whtRemit", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("finance.vat.generate"),
    (0, common_1.Get)("vat/:companyId/:period"),
    __param(0, (0, common_1.Param)("companyId")),
    __param(1, (0, common_1.Param)("period")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "vat", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("finance.vat.file"),
    (0, common_1.Post)("vat/file"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "fileVat", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("finance.period_lock.manage"),
    (0, common_1.Post)("period-lock/lock"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "lock", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("finance.period_lock.manage"),
    (0, common_1.Post)("period-lock/unlock"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "unlock", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("finance.credit_notes.manage"),
    (0, common_1.Post)("credit-notes"),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "createCredit", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("finance.tax_impact.read"),
    (0, common_1.Get)("tax-impact/:companyId/:period"),
    __param(0, (0, common_1.Param)("companyId")),
    __param(1, (0, common_1.Param)("period")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "taxImpact", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("finance.consolidated_pl.read"),
    (0, common_1.Get)("reports/consolidated-pl/:period"),
    __param(0, (0, common_1.Param)("period")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FinanceController.prototype, "consolidatedPL", null);
exports.FinanceController = FinanceController = __decorate([
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, common_1.Controller)("v1/finance"),
    __metadata("design:paramtypes", [cost_pool_service_1.CostPoolService,
        intercompany_invoicing_service_1.IntercompanyInvoicingService,
        payments_service_1.PaymentsService,
        tax_service_1.TaxService,
        period_lock_service_1.PeriodLockService,
        month_close_service_1.MonthCloseService,
        wht_remittance_service_1.WhtRemittanceService,
        credit_note_service_1.CreditNoteService,
        tax_impact_service_1.TaxImpactService,
        consolidated_pl_service_1.ConsolidatedPLService,
        ledger_posting_service_1.LedgerPostingService])
], FinanceController);
//# sourceMappingURL=finance.controller.js.map