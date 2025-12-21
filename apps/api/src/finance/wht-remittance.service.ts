import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Decimal } from "@prisma/client/runtime/library";
import { TaxType } from "./finance.enums";

function dec(v: any) { return new Decimal(v); }
function round2(d: Decimal) { return new Decimal(d.toFixed(2)); }

@Injectable()
export class WhtRemittanceService {
  constructor(private readonly prisma: PrismaService) {}

  async getWhtSchedule(params: { issuerCompanyId: string; period: string }) {
    const notes = await this.prisma.whtCreditNote.findMany({
      where: { issuerCompanyId: params.issuerCompanyId, period: params.period, remittanceDate: null },
    });

    const grouped: Record<string, { taxType: string; amount: string; count: number }> = {};
    for (const n of notes) {
      const key = n.taxType;
      const prev = grouped[key]?.amount ? dec(grouped[key].amount) : dec(0);
      const next = prev.plus(dec(n.amount));
      grouped[key] = { taxType: n.taxType, amount: round2(next).toString(), count: (grouped[key]?.count ?? 0) + 1 };
    }

    return {
      issuerCompanyId: params.issuerCompanyId,
      period: params.period,
      items: Object.values(grouped),
      total: round2(Object.values(grouped).reduce((s, i) => s.plus(dec(i.amount)), dec(0))).toString(),
    };
  }

  async markRemitted(params: { issuerCompanyId: string; period: string; taxType: TaxType; remittanceDate: Date; firReceiptRef: string }) {
    const result = await this.prisma.whtCreditNote.updateMany({
      where: { issuerCompanyId: params.issuerCompanyId, period: params.period, taxType: params.taxType, remittanceDate: null },
      data: { remittanceDate: params.remittanceDate, firReceiptRef: params.firReceiptRef },
    });
    if (result.count === 0) throw new BadRequestException("No unremitted WHT credit notes found for the given filters");
    return { updatedCount: result.count };
  }
}
