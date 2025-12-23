import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Decimal } from "@prisma/client/runtime/library";
import { TaxType, InvoiceStatus } from "./finance.enums";
import { requireGroupId } from "./finance-tenancy";

function dec(v: any) { return new Decimal(v); }
function round2(d: Decimal) { return new Decimal(d.toFixed(2)); }

async function recomputeInvoiceStatus(prisma: PrismaService, invoiceId: string) {
  const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId }, include: { payments: true } });
  if (!invoice) return;

  const paid = round2(invoice.payments.reduce((s: any, p: any) => s.plus(dec(p.amountPaid)), dec(0)));
  const total = round2(dec(invoice.totalAmount));

  let status: any = "ISSUED";
  if (paid.greaterThanOrEqualTo(total)) status = "PAID";
  else if (paid.greaterThan(0)) status = "PART_PAID";
  else status = invoice.status === "DRAFT" ? "DRAFT" : "ISSUED";

  await prisma.invoice.update({ where: { id: invoiceId }, data: { status } });
  return { paid: paid.toString(), total: total.toString(), status };
}

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async recordIntercompanyPayment(params: {
    groupId: string;
    invoiceId: string;
    paymentDate: Date;
    amountPaid: Decimal | string | number;
    whtWithheldAmount?: Decimal | string | number;
    reference?: string;
    notes?: string;
  }) {
    requireGroupId(params.groupId);
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id: params.invoiceId,
        OR: [{ sellerCompany: { groupId: params.groupId } }, { buyerCompany: { groupId: params.groupId } }],
      },
      include: { lines: { include: { agreement: true } } },
    });
    if (!invoice) throw new BadRequestException("Invoice not found");
    if (invoice.status === InvoiceStatus.VOID) throw new BadRequestException("Cannot pay VOID invoice");
    if (!invoice.period) throw new BadRequestException("Invoice has no period");

    const split = new Map<string, Decimal>();
    let expectedTotal = dec(0);

    for (const line of invoice.lines) {
      const wht = round2(dec(line.whtAmount));
      if (wht.lessThanOrEqualTo(0)) continue;

      expectedTotal = expectedTotal.plus(wht);
      const taxType = line.agreement?.whtTaxType ?? TaxType.SERVICES;
      split.set(taxType, (split.get(taxType) ?? dec(0)).plus(wht));
    }

    const providedWht = params.whtWithheldAmount == null ? expectedTotal : round2(dec(params.whtWithheldAmount));
    if (expectedTotal.greaterThan(0) && providedWht.equals(0)) {
      throw new BadRequestException(`WHT withheld is 0 but expected ${expectedTotal.toString()}`);
    }

    const diff = expectedTotal.minus(providedWht).abs();
    if (diff.greaterThan(dec("1.00"))) {
      throw new BadRequestException(`WHT mismatch: expected ${expectedTotal.toString()} vs provided ${providedWht.toString()}`);
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
      if (amount.lessThanOrEqualTo(0)) continue;
      creditNotes.push(
        await this.prisma.whtCreditNote.create({
          data: {
            period: invoice.period,
            issuerCompanyId: invoice.buyerCompanyId,
            beneficiaryCompanyId: invoice.sellerCompanyId,
            taxType,
            amount: round2(amount),
          },
        })
      );
    }

    const statusInfo = await recomputeInvoiceStatus(this.prisma, invoice.id);

    return { paymentId: payment.id, expectedWht: expectedTotal.toString(), creditNotesCreated: creditNotes.length, invoice: statusInfo };
  }
}
