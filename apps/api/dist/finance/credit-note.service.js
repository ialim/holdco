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
exports.CreditNoteService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const library_1 = require("@prisma/client/runtime/library");
const finance_enums_1 = require("./finance.enums");
const ledger_posting_service_1 = require("./ledger-posting.service");
function dec(v) { return new library_1.Decimal(v); }
function round2(d) { return new library_1.Decimal(d.toFixed(2)); }
let CreditNoteService = class CreditNoteService {
    constructor(prisma, ledgerPostingService) {
        this.prisma = prisma;
        this.ledgerPostingService = ledgerPostingService;
    }
    async createCreditNote(params) {
        const original = await this.prisma.invoice.findUnique({
            where: { id: params.originalInvoiceId },
            include: { lines: true },
        });
        if (!original)
            throw new common_1.BadRequestException("Original invoice not found");
        if (!original.period)
            throw new common_1.BadRequestException("Original invoice has no period");
        const originalLines = original.lines;
        const creditLines = params.fullReversal
            ? originalLines.map((l) => ({
                agreementId: l.agreementId,
                description: `CREDIT NOTE (reversal): ${l.description}`,
                netAmount: round2(dec(l.netAmount).mul(-1)),
                vatRate: dec(l.vatRate),
                vatAmount: round2(dec(l.vatAmount).mul(-1)),
                whtRate: dec(l.whtRate),
                whtAmount: round2(dec(l.whtAmount).mul(-1)),
                grossAmount: round2(dec(l.grossAmount).mul(-1)),
            }))
            : (() => {
                if (!params.lines?.length)
                    throw new common_1.BadRequestException("Provide lines or set fullReversal=true");
                const map = new Map(params.lines.map((x) => [x.originalLineId, dec(x.creditNetAmount)]));
                return originalLines
                    .filter((l) => map.has(l.id))
                    .map((l) => {
                    const creditNet = round2(map.get(l.id).mul(-1));
                    const vat = round2(creditNet.mul(dec(l.vatRate)));
                    const wht = round2(creditNet.mul(dec(l.whtRate)));
                    const gross = round2(creditNet.plus(vat));
                    return {
                        agreementId: l.agreementId,
                        description: `CREDIT NOTE: ${l.description}`,
                        netAmount: creditNet,
                        vatRate: dec(l.vatRate),
                        vatAmount: vat,
                        whtRate: dec(l.whtRate),
                        whtAmount: wht,
                        grossAmount: gross,
                    };
                });
            })();
        const subtotal = round2(creditLines.reduce((s, l) => s.plus(dec(l.netAmount)), dec(0)));
        const vatAmount = round2(creditLines.reduce((s, l) => s.plus(dec(l.vatAmount)), dec(0)));
        const total = round2(creditLines.reduce((s, l) => s.plus(dec(l.grossAmount)), dec(0)));
        const cn = await this.prisma.invoice.create({
            data: {
                invoiceType: original.invoiceType ?? finance_enums_1.InvoiceType.INTERCOMPANY,
                status: finance_enums_1.InvoiceStatus.ISSUED,
                sellerCompanyId: original.sellerCompanyId,
                buyerCompanyId: original.buyerCompanyId,
                period: original.period,
                issueDate: params.issueDate,
                dueDate: original.dueDate,
                subtotal,
                vatAmount,
                totalAmount: total,
                isCreditNote: true,
                relatedInvoiceId: original.id,
                lines: { create: creditLines },
            },
        });
        await this.ledgerPostingService.postInvoiceToLedger({ invoiceId: cn.id });
        return cn;
    }
};
exports.CreditNoteService = CreditNoteService;
exports.CreditNoteService = CreditNoteService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService, ledger_posting_service_1.LedgerPostingService])
], CreditNoteService);
//# sourceMappingURL=credit-note.service.js.map