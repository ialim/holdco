import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Decimal } from "@prisma/client/runtime/library";
import { InvoiceStatus } from "./finance.enums";

function dec(v: any) { return new Decimal(v); }
function round2(d: Decimal) { return new Decimal(d.toFixed(2)); }

@Injectable()
export class TaxImpactService {
  constructor(private readonly prisma: PrismaService) {}

  async companyTaxImpact(params: { companyId: string; period: string }) {
    const sold = await this.prisma.invoice.findMany({
      where: { sellerCompanyId: params.companyId, period: params.period, status: { not: InvoiceStatus.VOID } },
      select: { vatAmount: true },
    });

    const bought = await this.prisma.invoice.findMany({
      where: { buyerCompanyId: params.companyId, period: params.period, status: { not: InvoiceStatus.VOID } },
      select: { vatAmount: true },
    });

    const outputVat = round2(sold.reduce((s: any, i: any) => s.plus(dec(i.vatAmount)), dec(0)));
    const inputVat = round2(bought.reduce((s: any, i: any) => s.plus(dec(i.vatAmount)), dec(0)));
    const netVat = round2(outputVat.minus(inputVat));

    const payments = await this.prisma.payment.findMany({
      where: { payerCompanyId: params.companyId, invoice: { period: params.period } },
      select: { whtWithheldAmount: true },
    });
    const whtWithheld = round2(payments.reduce((s: any, p: any) => s.plus(dec(p.whtWithheldAmount)), dec(0)));

    const credits = await this.prisma.whtCreditNote.findMany({
      where: { beneficiaryCompanyId: params.companyId, period: params.period },
      select: { amount: true, taxType: true, remittanceDate: true },
    });

    const whtCreditsTotal = round2(credits.reduce((s: any, c: any) => s.plus(dec(c.amount)), dec(0)));
    const whtCreditsByType = credits.reduce((acc: any, c: any) => {
      const k = c.taxType;
      acc[k] = round2(dec(acc[k] ?? 0).plus(dec(c.amount))).toString();
      return acc;
    }, {} as Record<string, string>);

    const unremittedCredits = credits.filter((c: any) => !c.remittanceDate).length;

    return {
      companyId: params.companyId,
      period: params.period,
      vat: { outputVat: outputVat.toString(), inputVat: inputVat.toString(), netVatPayable: netVat.toString() },
      wht: { withheldByCompany: whtWithheld.toString(), creditsEarnedTotal: whtCreditsTotal.toString(), creditsByType: whtCreditsByType, unremittedCreditNotesCount: unremittedCredits },
    };
  }
}
