import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Decimal } from "@prisma/client/runtime/library";
import { InvoiceType, InvoiceStatus } from "./finance.enums";
import { assertInvoiceInGroup, requireGroupId } from "./finance-tenancy";
import { assertPostingCodeAllowed } from "./ledger-code-rules";

function dec(v: any) { return new Decimal(v); }
function round2(d: Decimal) { return new Decimal(d.toFixed(2)); }

async function getAccountId(prisma: PrismaService, companyId: string, code: string) {
  assertPostingCodeAllowed(code);
  const acct = await prisma.ledgerAccount.findUnique({ where: { companyId_code: { companyId, code } } });
  if (!acct) throw new BadRequestException(`Ledger account ${code} missing for company ${companyId}`);
  return acct.id;
}

@Injectable()
export class LedgerPostingService {
  constructor(private readonly prisma: PrismaService) {}

  async postInvoiceToLedger(params: { groupId: string; invoiceId: string }) {
    requireGroupId(params.groupId);
    const invoice = await assertInvoiceInGroup(this.prisma, params.groupId, params.invoiceId);
    if (invoice.status === InvoiceStatus.VOID) throw new BadRequestException("Cannot post VOID invoice");
    if (!invoice.period) throw new BadRequestException("Invoice period is required for ledger posting");

    const net = round2(dec(invoice.subtotal));

    await this.prisma.ledgerEntry.deleteMany({ where: { sourceType: "INVOICE", sourceRef: invoice.id } });

    if (invoice.invoiceType === InvoiceType.INTERCOMPANY) {
      const sellerRevAcct = await getAccountId(this.prisma, invoice.sellerCompanyId, "IC_REV");
      const buyerExpAcct = await getAccountId(this.prisma, invoice.buyerCompanyId, "IC_EXP");

      await this.prisma.ledgerEntry.create({
        data: {
          companyId: invoice.sellerCompanyId,
          period: invoice.period,
          entryDate: invoice.issueDate,
          accountId: sellerRevAcct,
          debit: net.lessThan(0) ? net.abs() : new Decimal(0),
          credit: net.greaterThan(0) ? net : new Decimal(0),
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
          debit: net.greaterThan(0) ? net : new Decimal(0),
          credit: net.lessThan(0) ? net.abs() : new Decimal(0),
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
        debit: net.lessThan(0) ? net.abs() : new Decimal(0),
        credit: net.greaterThan(0) ? net : new Decimal(0),
        memo: `External invoice posting (${invoice.period})`,
        sourceType: "INVOICE",
        sourceRef: invoice.id,
      },
    });

    return { posted: true, invoiceId: invoice.id, net: net.toString(), type: "EXTERNAL" };
  }

  async postAllInvoicesForPeriod(params: { groupId: string; period: string }) {
    requireGroupId(params.groupId);
    const invoices = await this.prisma.invoice.findMany({
      where: {
        period: params.period,
        status: { not: InvoiceStatus.VOID },
        OR: [{ sellerCompany: { groupId: params.groupId } }, { buyerCompany: { groupId: params.groupId } }],
      },
      select: { id: true },
    });
    for (const inv of invoices) await this.postInvoiceToLedger({ groupId: params.groupId, invoiceId: inv.id });
    return { period: params.period, postedCount: invoices.length };
  }
}
