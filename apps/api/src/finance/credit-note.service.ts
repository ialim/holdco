import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Decimal } from "@prisma/client/runtime/library";
import { InvoiceStatus, InvoiceType } from "./finance.enums";
import { LedgerPostingService } from "./ledger-posting.service";

function dec(v: any) { return new Decimal(v); }
function round2(d: Decimal) { return new Decimal(d.toFixed(2)); }

@Injectable()
export class CreditNoteService {
  constructor(private readonly prisma: PrismaService, private readonly ledgerPostingService: LedgerPostingService) {}

  async createCreditNote(params: {
    originalInvoiceId: string;
    issueDate: Date;
    reason: string;
    lines?: { originalLineId: string; creditNetAmount: string | number }[];
    fullReversal?: boolean;
  }) {
    const original = await this.prisma.invoice.findUnique({
      where: { id: params.originalInvoiceId },
      include: { lines: true },
    });
    if (!original) throw new BadRequestException("Original invoice not found");
    if (!original.period) throw new BadRequestException("Original invoice has no period");

    const originalLines = original.lines;

    const creditLines = params.fullReversal
      ? originalLines.map((l: any) => ({
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
          if (!params.lines?.length) throw new BadRequestException("Provide lines or set fullReversal=true");
          const map = new Map(params.lines.map((x) => [x.originalLineId, dec(x.creditNetAmount)]));
          return originalLines
            .filter((l: any) => map.has(l.id))
            .map((l: any) => {
              const creditNet = round2(map.get(l.id)!.mul(-1));
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

    const subtotal = round2(creditLines.reduce((s: any, l: any) => s.plus(dec(l.netAmount)), dec(0)));
    const vatAmount = round2(creditLines.reduce((s: any, l: any) => s.plus(dec(l.vatAmount)), dec(0)));
    const total = round2(creditLines.reduce((s: any, l: any) => s.plus(dec(l.grossAmount)), dec(0)));

    const cn = await this.prisma.invoice.create({
      data: {
        invoiceType: original.invoiceType ?? InvoiceType.INTERCOMPANY,
        status: InvoiceStatus.ISSUED,
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
}
