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
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const library_1 = require("@prisma/client/runtime/library");
const finance_enums_1 = require("./finance.enums");
function dec(v) { return new library_1.Decimal(v); }
function round2(d) { return new library_1.Decimal(d.toFixed(2)); }
async function recomputeInvoiceStatus(prisma, invoiceId) {
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId }, include: { payments: true } });
    if (!invoice)
        return;
    const paid = round2(invoice.payments.reduce((s, p) => s.plus(dec(p.amountPaid)), dec(0)));
    const total = round2(dec(invoice.totalAmount));
    let status = "ISSUED";
    if (paid.greaterThanOrEqualTo(total))
        status = "PAID";
    else if (paid.greaterThan(0))
        status = "PART_PAID";
    else
        status = invoice.status === "DRAFT" ? "DRAFT" : "ISSUED";
    await prisma.invoice.update({ where: { id: invoiceId }, data: { status } });
    return { paid: paid.toString(), total: total.toString(), status };
}
let PaymentsService = class PaymentsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async recordIntercompanyPayment(params) {
        const invoice = await this.prisma.invoice.findUnique({
            where: { id: params.invoiceId },
            include: { lines: { include: { agreement: true } } },
        });
        if (!invoice)
            throw new common_1.BadRequestException("Invoice not found");
        if (invoice.status === finance_enums_1.InvoiceStatus.VOID)
            throw new common_1.BadRequestException("Cannot pay VOID invoice");
        if (!invoice.period)
            throw new common_1.BadRequestException("Invoice has no period");
        const split = new Map();
        let expectedTotal = dec(0);
        for (const line of invoice.lines) {
            const wht = round2(dec(line.whtAmount));
            if (wht.lessThanOrEqualTo(0))
                continue;
            expectedTotal = expectedTotal.plus(wht);
            const taxType = line.agreement?.whtTaxType ?? finance_enums_1.TaxType.SERVICES;
            split.set(taxType, (split.get(taxType) ?? dec(0)).plus(wht));
        }
        const providedWht = params.whtWithheldAmount == null ? expectedTotal : round2(dec(params.whtWithheldAmount));
        if (expectedTotal.greaterThan(0) && providedWht.equals(0)) {
            throw new common_1.BadRequestException(`WHT withheld is 0 but expected ${expectedTotal.toString()}`);
        }
        const diff = expectedTotal.minus(providedWht).abs();
        if (diff.greaterThan(dec("1.00"))) {
            throw new common_1.BadRequestException(`WHT mismatch: expected ${expectedTotal.toString()} vs provided ${providedWht.toString()}`);
        }
        const payment = await this.prisma.payment.create({
            data: {
                invoiceId: invoice.id,
                payerCompanyId: invoice.buyerCompanyId,
                payeeCompanyId: invoice.sellerCompanyId,
                paymentDate: params.paymentDate,
                amountPaid: round2(dec(params.amountPaid)),
                whtWithheldAmount: providedWht,
                reference: params.reference,
                notes: params.notes,
            },
        });
        const creditNotes = [];
        for (const [taxType, amount] of split.entries()) {
            if (amount.lessThanOrEqualTo(0))
                continue;
            creditNotes.push(await this.prisma.whtCreditNote.create({
                data: {
                    period: invoice.period,
                    issuerCompanyId: invoice.buyerCompanyId,
                    beneficiaryCompanyId: invoice.sellerCompanyId,
                    taxType,
                    amount: round2(amount),
                },
            }));
        }
        const statusInfo = await recomputeInvoiceStatus(this.prisma, invoice.id);
        return { paymentId: payment.id, expectedWht: expectedTotal.toString(), creditNotesCreated: creditNotes.length, invoice: statusInfo };
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map