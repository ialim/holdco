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
exports.LedgerPostingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const library_1 = require("@prisma/client/runtime/library");
const finance_enums_1 = require("./finance.enums");
function dec(v) { return new library_1.Decimal(v); }
function round2(d) { return new library_1.Decimal(d.toFixed(2)); }
async function getAccountId(prisma, companyId, code) {
    const acct = await prisma.ledgerAccount.findUnique({ where: { companyId_code: { companyId, code } } });
    if (!acct)
        throw new common_1.BadRequestException(`Ledger account ${code} missing for company ${companyId}`);
    return acct.id;
}
let LedgerPostingService = class LedgerPostingService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async postInvoiceToLedger(params) {
        const invoice = await this.prisma.invoice.findUnique({ where: { id: params.invoiceId } });
        if (!invoice)
            throw new common_1.BadRequestException("Invoice not found");
        if (invoice.status === finance_enums_1.InvoiceStatus.VOID)
            throw new common_1.BadRequestException("Cannot post VOID invoice");
        if (!invoice.period)
            throw new common_1.BadRequestException("Invoice period is required for ledger posting");
        const net = round2(dec(invoice.subtotal));
        await this.prisma.ledgerEntry.deleteMany({ where: { sourceType: "INVOICE", sourceRef: invoice.id } });
        if (invoice.invoiceType === finance_enums_1.InvoiceType.INTERCOMPANY) {
            const sellerRevAcct = await getAccountId(this.prisma, invoice.sellerCompanyId, "IC_REV");
            const buyerExpAcct = await getAccountId(this.prisma, invoice.buyerCompanyId, "IC_EXP");
            await this.prisma.ledgerEntry.create({
                data: {
                    companyId: invoice.sellerCompanyId,
                    period: invoice.period,
                    entryDate: invoice.issueDate,
                    accountId: sellerRevAcct,
                    debit: net.lessThan(0) ? net.abs() : new library_1.Decimal(0),
                    credit: net.greaterThan(0) ? net : new library_1.Decimal(0),
                    memo: `Intercompany invoice posting (${invoice.period})`,
                    sourceType: "INVOICE",
                    sourceRef: invoice.id,
                },
            });
            await this.prisma.ledgerEntry.create({
                data: {
                    companyId: invoice.buyerCompanyId,
                    period: invoice.period,
                    entryDate: invoice.issueDate,
                    accountId: buyerExpAcct,
                    debit: net.greaterThan(0) ? net : new library_1.Decimal(0),
                    credit: net.lessThan(0) ? net.abs() : new library_1.Decimal(0),
                    memo: `Intercompany invoice posting (${invoice.period})`,
                    sourceType: "INVOICE",
                    sourceRef: invoice.id,
                },
            });
            return { posted: true, invoiceId: invoice.id, net: net.toString(), type: "INTERCOMPANY" };
        }
        const sellerSalesAcct = await getAccountId(this.prisma, invoice.sellerCompanyId, "REV_SALES");
        await this.prisma.ledgerEntry.create({
            data: {
                companyId: invoice.sellerCompanyId,
                period: invoice.period,
                entryDate: invoice.issueDate,
                accountId: sellerSalesAcct,
                debit: net.lessThan(0) ? net.abs() : new library_1.Decimal(0),
                credit: net.greaterThan(0) ? net : new library_1.Decimal(0),
                memo: `External invoice posting (${invoice.period})`,
                sourceType: "INVOICE",
                sourceRef: invoice.id,
            },
        });
        return { posted: true, invoiceId: invoice.id, net: net.toString(), type: "EXTERNAL" };
    }
    async postAllInvoicesForPeriod(params) {
        const invoices = await this.prisma.invoice.findMany({
            where: { period: params.period, status: { not: finance_enums_1.InvoiceStatus.VOID } },
            select: { id: true },
        });
        for (const inv of invoices)
            await this.postInvoiceToLedger({ invoiceId: inv.id });
        return { period: params.period, postedCount: invoices.length };
    }
};
exports.LedgerPostingService = LedgerPostingService;
exports.LedgerPostingService = LedgerPostingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LedgerPostingService);
//# sourceMappingURL=ledger-posting.service.js.map