import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Decimal } from "@prisma/client/runtime/library";
import { AgreementType, PricingModel, InvoiceStatus, InvoiceType } from "./finance.enums";
import { LedgerPostingService } from "./ledger-posting.service";
import { PeriodLockService } from "./period-lock.service";
import { assertCompaniesInGroup, assertCompanyInGroup, assertInvoiceInGroup, requireGroupId } from "./finance-tenancy";

function dec(v: any) { return new Decimal(v); }
function round2(d: Decimal) { return new Decimal(d.toFixed(2)); }

@Injectable()
export class IntercompanyInvoicingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerPostingService: LedgerPostingService,
    private readonly periodLockService: PeriodLockService,
  ) {}

  async generateIntercompanyInvoices(params: {
    groupId: string;
    holdcoCompanyId: string;
    period: string;
    issueDate: Date;
    dueDays?: number;
  }) {
    requireGroupId(params.groupId);
    await assertCompanyInGroup(this.prisma, params.groupId, params.holdcoCompanyId, "Holding company");

    const dueDays = params.dueDays ?? 30;

    const pool = await this.prisma.costPool.findUnique({
      where: { companyId_period: { companyId: params.holdcoCompanyId, period: params.period } },
      include: { allocations: true },
    });
    if (!pool) throw new BadRequestException("CostPool not found for period");
    if (!pool.allocations.length) throw new BadRequestException("No allocations found. Run allocate first.");

    const agreements = await this.prisma.intercompanyAgreement.findMany({
      where: {
        providerCompanyId: params.holdcoCompanyId,
        effectiveFrom: { lte: params.issueDate },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: params.issueDate } }],
      },
    });

    const byRecipient: Record<string, { mgmt?: any; ip?: any }> = {};
    for (const ag of agreements) {
      byRecipient[ag.recipientCompanyId] ??= {};
      if (ag.type === AgreementType.MANAGEMENT) byRecipient[ag.recipientCompanyId].mgmt = ag;
      if (ag.type === AgreementType.IP_LICENSE) byRecipient[ag.recipientCompanyId].ip = ag;
    }

    const recipientIds = pool.allocations.map((alloc) => alloc.recipientCompanyId);
    if (recipientIds.length) {
      await assertCompaniesInGroup(this.prisma, params.groupId, recipientIds, "Recipient company");
    }

    const results: { recipientCompanyId: string; invoiceId: string }[] = [];

    for (const alloc of pool.allocations) {
      const recipientId = alloc.recipientCompanyId;
      const mgmtAg = byRecipient[recipientId]?.mgmt;
      const ipAg = byRecipient[recipientId]?.ip;

      if (!mgmtAg || mgmtAg.pricingModel !== PricingModel.COST_PLUS) {
        throw new BadRequestException(`Missing MANAGEMENT COST_PLUS agreement for recipient ${recipientId}`);
      }
      if (!ipAg || ipAg.pricingModel !== PricingModel.FIXED_MONTHLY) {
        throw new BadRequestException(`Missing IP_LICENSE FIXED_MONTHLY agreement for recipient ${recipientId}`);
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
          invoiceType: InvoiceType.INTERCOMPANY,
          sellerCompanyId: params.holdcoCompanyId,
          buyerCompanyId: recipientId,
          period: params.period,
          status: { in: [InvoiceStatus.DRAFT, InvoiceStatus.ISSUED, InvoiceStatus.PART_PAID] },
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
              invoiceType: InvoiceType.INTERCOMPANY,
              status: InvoiceStatus.DRAFT,
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

  async issueInvoice(groupId: string, invoiceId: string) {
    requireGroupId(groupId);
    const invoice = await assertInvoiceInGroup(this.prisma, groupId, invoiceId);
    if (!invoice.period) throw new BadRequestException("Invoice period missing");

    await this.periodLockService.assertNotLocked(invoice.sellerCompanyId, invoice.period);

    const updated = await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: InvoiceStatus.ISSUED },
    });

    await this.ledgerPostingService.postInvoiceToLedger({ groupId, invoiceId });

    return updated;
  }
}
