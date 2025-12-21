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
exports.TaxImpactService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const library_1 = require("@prisma/client/runtime/library");
const finance_enums_1 = require("./finance.enums");
function dec(v) { return new library_1.Decimal(v); }
function round2(d) { return new library_1.Decimal(d.toFixed(2)); }
let TaxImpactService = class TaxImpactService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async companyTaxImpact(params) {
        const sold = await this.prisma.invoice.findMany({
            where: { sellerCompanyId: params.companyId, period: params.period, status: { not: finance_enums_1.InvoiceStatus.VOID } },
            select: { vatAmount: true },
        });
        const bought = await this.prisma.invoice.findMany({
            where: { buyerCompanyId: params.companyId, period: params.period, status: { not: finance_enums_1.InvoiceStatus.VOID } },
            select: { vatAmount: true },
        });
        const outputVat = round2(sold.reduce((s, i) => s.plus(dec(i.vatAmount)), dec(0)));
        const inputVat = round2(bought.reduce((s, i) => s.plus(dec(i.vatAmount)), dec(0)));
        const netVat = round2(outputVat.minus(inputVat));
        const payments = await this.prisma.payment.findMany({
            where: { payerCompanyId: params.companyId, invoice: { period: params.period } },
            select: { whtWithheldAmount: true },
        });
        const whtWithheld = round2(payments.reduce((s, p) => s.plus(dec(p.whtWithheldAmount)), dec(0)));
        const credits = await this.prisma.whtCreditNote.findMany({
            where: { beneficiaryCompanyId: params.companyId, period: params.period },
            select: { amount: true, taxType: true, remittanceDate: true },
        });
        const whtCreditsTotal = round2(credits.reduce((s, c) => s.plus(dec(c.amount)), dec(0)));
        const whtCreditsByType = credits.reduce((acc, c) => {
            const k = c.taxType;
            acc[k] = round2(dec(acc[k] ?? 0).plus(dec(c.amount))).toString();
            return acc;
        }, {});
        const unremittedCredits = credits.filter((c) => !c.remittanceDate).length;
        return {
            companyId: params.companyId,
            period: params.period,
            vat: { outputVat: outputVat.toString(), inputVat: inputVat.toString(), netVatPayable: netVat.toString() },
            wht: { withheldByCompany: whtWithheld.toString(), creditsEarnedTotal: whtCreditsTotal.toString(), creditsByType: whtCreditsByType, unremittedCreditNotesCount: unremittedCredits },
        };
    }
};
exports.TaxImpactService = TaxImpactService;
exports.TaxImpactService = TaxImpactService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TaxImpactService);
//# sourceMappingURL=tax-impact.service.js.map