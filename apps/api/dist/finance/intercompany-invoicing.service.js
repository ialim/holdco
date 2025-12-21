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
exports.IntercompanyInvoicingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const library_1 = require("@prisma/client/runtime/library");
const finance_enums_1 = require("./finance.enums");
const ledger_posting_service_1 = require("./ledger-posting.service");
const period_lock_service_1 = require("./period-lock.service");
function dec(v) { return new library_1.Decimal(v); }
function round2(d) { return new library_1.Decimal(d.toFixed(2)); }
let IntercompanyInvoicingService = class IntercompanyInvoicingService {
    constructor(prisma, ledgerPostingService, periodLockService) {
        this.prisma = prisma;
        this.ledgerPostingService = ledgerPostingService;
        this.periodLockService = periodLockService;
    }
    async generateIntercompanyInvoices(params) {
        var _a;
        const dueDays = params.dueDays ?? 30;
        const pool = await this.prisma.costPool.findUnique({
            where: { companyId_period: { companyId: params.holdcoCompanyId, period: params.period } },
            include: { allocations: true },
        });
        if (!pool)
            throw new common_1.BadRequestException("CostPool not found for period");
        if (!pool.allocations.length)
            throw new common_1.BadRequestException("No allocations found. Run allocate first.");
        const agreements = await this.prisma.intercompanyAgreement.findMany({
            where: {
                providerCompanyId: params.holdcoCompanyId,
                effectiveFrom: { lte: params.issueDate },
                OR: [{ effectiveTo: null }, { effectiveTo: { gte: params.issueDate } }],
            },
        });
        const byRecipient = {};
        for (const ag of agreements) {
            byRecipient[_a = ag.recipientCompanyId] ?? (byRecipient[_a] = {});
            if (ag.type === finance_enums_1.AgreementType.MANAGEMENT)
                byRecipient[ag.recipientCompanyId].mgmt = ag;
            if (ag.type === finance_enums_1.AgreementType.IP_LICENSE)
                byRecipient[ag.recipientCompanyId].ip = ag;
        }
        const results = [];
        for (const alloc of pool.allocations) {
            const recipientId = alloc.recipientCompanyId;
            const mgmtAg = byRecipient[recipientId]?.mgmt;
            const ipAg = byRecipient[recipientId]?.ip;
            if (!mgmtAg || mgmtAg.pricingModel !== finance_enums_1.PricingModel.COST_PLUS) {
                throw new common_1.BadRequestException(`Missing MANAGEMENT COST_PLUS agreement for recipient ${recipientId}`);
            }
            if (!ipAg || ipAg.pricingModel !== finance_enums_1.PricingModel.FIXED_MONTHLY) {
                throw new common_1.BadRequestException(`Missing IP_LICENSE FIXED_MONTHLY agreement for recipient ${recipientId}`);
            }
            const markup = dec(mgmtAg.markupRate ?? "0.05");
            const mgmtNet = round2(dec(alloc.allocatedCost).mul(dec(1).plus(markup)));
            const mgmtVat = mgmtAg.vatApplies ? round2(mgmtNet.mul(dec(mgmtAg.vatRate))) : dec(0);
            const mgmtWht = mgmtAg.whtApplies ? round2(mgmtNet.mul(dec(mgmtAg.whtRate))) : dec(0);
            const mgmtGross = round2(mgmtNet.plus(mgmtVat));
            const ipNet = round2(dec(ipAg.fixedFeeAmount));
            const ipVat = ipAg.vatApplies ? round2(ipNet.mul(dec(ipAg.vatRate))) : dec(0);
            const ipWht = ipAg.whtApplies ? round2(ipNet.mul(dec(ipAg.whtRate))) : dec(0);
            const ipGross = round2(ipNet.plus(ipVat));
            const subtotal = round2(mgmtNet.plus(ipNet));
            const vatAmount = round2(mgmtVat.plus(ipVat));
            const total = round2(mgmtGross.plus(ipGross));
            const dueDate = new Date(params.issueDate);
            dueDate.setDate(dueDate.getDate() + dueDays);
            const existing = await this.prisma.invoice.findFirst({
                where: {
                    invoiceType: finance_enums_1.InvoiceType.INTERCOMPANY,
                    sellerCompanyId: params.holdcoCompanyId,
                    buyerCompanyId: recipientId,
                    period: params.period,
                    status: { in: [finance_enums_1.InvoiceStatus.DRAFT, finance_enums_1.InvoiceStatus.ISSUED, finance_enums_1.InvoiceStatus.PART_PAID] },
                },
            });
            const invoice = existing
                ? await this.prisma.invoice.update({
                    where: { id: existing.id },
                    data: {
                        issueDate: params.issueDate,
                        dueDate,
                        subtotal,
                        vatAmount,
                        totalAmount: total,
                        lines: {
                            deleteMany: {},
                            create: [
                                {
                                    agreementId: mgmtAg.id,
                                    description: `Management services fee (${params.period}) - cost+${dec(markup).mul(100).toString()}%`,
                                    netAmount: mgmtNet,
                                    vatRate: dec(mgmtAg.vatRate),
                                    vatAmount: mgmtVat,
                                    whtRate: dec(mgmtAg.whtRate),
                                    whtAmount: mgmtWht,
                                    grossAmount: mgmtGross,
                                },
                                {
                                    agreementId: ipAg.id,
                                    description: `IP/Software license fee (${params.period}) - fixed monthly`,
                                    netAmount: ipNet,
                                    vatRate: dec(ipAg.vatRate),
                                    vatAmount: ipVat,
                                    whtRate: dec(ipAg.whtRate),
                                    whtAmount: ipWht,
                                    grossAmount: ipGross,
                                },
                            ],
                        },
                    },
                })
                : await this.prisma.invoice.create({
                    data: {
                        invoiceType: finance_enums_1.InvoiceType.INTERCOMPANY,
                        status: finance_enums_1.InvoiceStatus.DRAFT,
                        sellerCompanyId: params.holdcoCompanyId,
                        buyerCompanyId: recipientId,
                        period: params.period,
                        issueDate: params.issueDate,
                        dueDate,
                        subtotal,
                        vatAmount,
                        totalAmount: total,
                        lines: {
                            create: [
                                {
                                    agreementId: mgmtAg.id,
                                    description: `Management services fee (${params.period}) - cost+${dec(markup).mul(100).toString()}%`,
                                    netAmount: mgmtNet,
                                    vatRate: dec(mgmtAg.vatRate),
                                    vatAmount: mgmtVat,
                                    whtRate: dec(mgmtAg.whtRate),
                                    whtAmount: mgmtWht,
                                    grossAmount: mgmtGross,
                                },
                                {
                                    agreementId: ipAg.id,
                                    description: `IP/Software license fee (${params.period}) - fixed monthly`,
                                    netAmount: ipNet,
                                    vatRate: dec(ipAg.vatRate),
                                    vatAmount: ipVat,
                                    whtRate: dec(ipAg.whtRate),
                                    whtAmount: ipWht,
                                    grossAmount: ipGross,
                                },
                            ],
                        },
                    },
                });
            results.push({ recipientCompanyId: recipientId, invoiceId: invoice.id });
        }
        return { period: params.period, invoices: results };
    }
    async issueInvoice(invoiceId) {
        const invoice = await this.prisma.invoice.findUnique({ where: { id: invoiceId } });
        if (!invoice)
            throw new common_1.BadRequestException("Invoice not found");
        if (!invoice.period)
            throw new common_1.BadRequestException("Invoice period missing");
        await this.periodLockService.assertNotLocked(invoice.sellerCompanyId, invoice.period);
        const updated = await this.prisma.invoice.update({
            where: { id: invoiceId },
            data: { status: finance_enums_1.InvoiceStatus.ISSUED },
        });
        await this.ledgerPostingService.postInvoiceToLedger({ invoiceId });
        return updated;
    }
};
exports.IntercompanyInvoicingService = IntercompanyInvoicingService;
exports.IntercompanyInvoicingService = IntercompanyInvoicingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ledger_posting_service_1.LedgerPostingService,
        period_lock_service_1.PeriodLockService])
], IntercompanyInvoicingService);
//# sourceMappingURL=intercompany-invoicing.service.js.map