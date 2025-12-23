import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Decimal } from "@prisma/client/runtime/library";
import { InvoiceStatus } from "./finance.enums";
import { assertCompanyInGroup, requireGroupId } from "./finance-tenancy";

function dec(v: any) { return new Decimal(v); }
function round2(d: Decimal) { return new Decimal(d.toFixed(2)); }

@Injectable()
export class TaxService {
  constructor(private readonly prisma: PrismaService) {}

  async generateVatReturn(params: { groupId: string; companyId: string; period: string }) {
    requireGroupId(params.groupId);
    await assertCompanyInGroup(this.prisma, params.groupId, params.companyId);

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
    const net = round2(outputVat.minus(inputVat));

    return this.prisma.vatReturn.upsert({
      where: { companyId_period: { companyId: params.companyId, period: params.period } },
      update: { outputVat, inputVat, netVatPayable: net },
      create: { companyId: params.companyId, period: params.period, outputVat, inputVat, netVatPayable: net },
    });
  }

  async fileVatReturn(params: { groupId: string; companyId: string; period: string; paymentRef?: string }) {
    requireGroupId(params.groupId);
    await assertCompanyInGroup(this.prisma, params.groupId, params.companyId);

    const vr = await this.prisma.vatReturn.findFirst({
      where: {
        companyId: params.companyId,
        period: params.period,
        company: { groupId: params.groupId },
      },
    });
    if (!vr) throw new Error("VAT return not generated yet");

    return this.prisma.vatReturn.update({
      where: { id: vr.id },
      data: { status: "FILED", filedAt: new Date(), paymentRef: params.paymentRef ?? vr.paymentRef },
    });
  }
}
