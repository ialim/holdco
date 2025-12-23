import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { FinanceExportQueryDto } from "./dto/finance-export-query.dto";

type ExportValue = string | number | boolean | null | undefined;
type ExportRow = Record<string, ExportValue>;

@Injectable()
export class FinanceExportsService {
  constructor(private readonly prisma: PrismaService) {}

  async exportJournalEntries(groupId: string, subsidiaryId: string, query: FinanceExportQueryDto) {
    this.requireHeaders(groupId, subsidiaryId);

    const dateRange = this.parseDateRange(query);
    const where: Record<string, any> = { groupId, subsidiaryId };

    if (query.fiscal_period_id) where.fiscalPeriodId = query.fiscal_period_id;
    if (query.period) where.fiscalPeriod = { name: query.period };
    if (dateRange) where.createdAt = dateRange;

    const entries = await this.prisma.journalEntry.findMany({
      where,
      include: {
        fiscalPeriod: true,
        lines: { include: { account: true, costCenter: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const columns = [
      "entry_id",
      "subsidiary_id",
      "fiscal_period_id",
      "fiscal_period_name",
      "reference",
      "memo",
      "status",
      "posted_at",
      "created_at",
      "line_id",
      "account_id",
      "account_code",
      "account_name",
      "cost_center_id",
      "cost_center_code",
      "line_description",
      "debit",
      "credit",
    ];

    const rows: ExportRow[] = [];
    for (const entry of entries) {
      if (!entry.lines.length) {
        rows.push({
          entry_id: entry.id,
          subsidiary_id: entry.subsidiaryId ?? null,
          fiscal_period_id: entry.fiscalPeriodId,
          fiscal_period_name: entry.fiscalPeriod?.name ?? null,
          reference: entry.reference ?? null,
          memo: entry.memo ?? null,
          status: entry.status,
          posted_at: entry.postedAt ? entry.postedAt.toISOString() : null,
          created_at: entry.createdAt.toISOString(),
          line_id: null,
          account_id: null,
          account_code: null,
          account_name: null,
          cost_center_id: null,
          cost_center_code: null,
          line_description: null,
          debit: null,
          credit: null,
        });
        continue;
      }

      for (const line of entry.lines) {
        rows.push({
          entry_id: entry.id,
          subsidiary_id: entry.subsidiaryId ?? null,
          fiscal_period_id: entry.fiscalPeriodId,
          fiscal_period_name: entry.fiscalPeriod?.name ?? null,
          reference: entry.reference ?? null,
          memo: entry.memo ?? null,
          status: entry.status,
          posted_at: entry.postedAt ? entry.postedAt.toISOString() : null,
          created_at: entry.createdAt.toISOString(),
          line_id: line.id,
          account_id: line.accountId,
          account_code: line.account?.code ?? null,
          account_name: line.account?.name ?? null,
          cost_center_id: line.costCenterId ?? null,
          cost_center_code: line.costCenter?.code ?? null,
          line_description: line.description ?? null,
          debit: line.debit.toString(),
          credit: line.credit.toString(),
        });
      }
    }

    return this.buildExportResponse("journal-entries", columns, rows, query.format);
  }

  async exportInvoices(groupId: string, subsidiaryId: string, query: FinanceExportQueryDto) {
    return this.exportInvoiceSet(groupId, subsidiaryId, query, { creditNotes: false, intercompany: false });
  }

  async exportCreditNotes(groupId: string, subsidiaryId: string, query: FinanceExportQueryDto) {
    return this.exportInvoiceSet(groupId, subsidiaryId, query, { creditNotes: true, intercompany: false });
  }

  async exportIntercompanyInvoices(groupId: string, subsidiaryId: string, query: FinanceExportQueryDto) {
    return this.exportInvoiceSet(groupId, subsidiaryId, query, { creditNotes: false, intercompany: true });
  }

  async exportPayments(groupId: string, subsidiaryId: string, query: FinanceExportQueryDto) {
    this.requireHeaders(groupId, subsidiaryId);

    const dateRange = this.parseDateRange(query);
    const where: Record<string, any> = {
      AND: [
        { OR: [{ payerCompany: { groupId } }, { payeeCompany: { groupId } }] },
        { OR: [{ payerCompanyId: subsidiaryId }, { payeeCompanyId: subsidiaryId }] },
      ],
    };

    if (dateRange) where.AND.push({ paymentDate: dateRange });
    if (query.period) where.AND.push({ invoice: { period: query.period } });

    const payments = await this.prisma.payment.findMany({
      where,
      orderBy: { paymentDate: "desc" },
    });

    const columns = [
      "payment_id",
      "invoice_id",
      "payer_company_id",
      "payee_company_id",
      "payment_date",
      "amount_paid",
      "wht_withheld_amount",
      "reference",
      "notes",
      "created_at",
    ];

    const rows: ExportRow[] = payments.map((payment) => ({
      payment_id: payment.id,
      invoice_id: payment.invoiceId,
      payer_company_id: payment.payerCompanyId,
      payee_company_id: payment.payeeCompanyId,
      payment_date: payment.paymentDate.toISOString(),
      amount_paid: payment.amountPaid.toString(),
      wht_withheld_amount: payment.whtWithheldAmount.toString(),
      reference: payment.reference ?? null,
      notes: payment.notes ?? null,
      created_at: payment.createdAt.toISOString(),
    }));

    return this.buildExportResponse("payments", columns, rows, query.format);
  }

  private async exportInvoiceSet(
    groupId: string,
    subsidiaryId: string,
    query: FinanceExportQueryDto,
    options: { creditNotes: boolean; intercompany: boolean },
  ) {
    this.requireHeaders(groupId, subsidiaryId);

    const dateRange = this.parseDateRange(query);
    const where: Record<string, any> = {
      AND: [
        { OR: [{ sellerCompany: { groupId } }, { buyerCompany: { groupId } }] },
        { OR: [{ sellerCompanyId: subsidiaryId }, { buyerCompanyId: subsidiaryId }] },
        { isCreditNote: options.creditNotes },
      ],
    };

    if (options.intercompany) where.AND.push({ invoiceType: "INTERCOMPANY" });
    else if (query.invoice_type) where.AND.push({ invoiceType: query.invoice_type });
    if (query.period) where.AND.push({ period: query.period });
    if (dateRange) where.AND.push({ issueDate: dateRange });

    const invoices = await this.prisma.invoice.findMany({
      where,
      orderBy: { issueDate: "desc" },
    });

    const columns = [
      "invoice_id",
      "order_id",
      "invoice_type",
      "status",
      "seller_company_id",
      "buyer_company_id",
      "period",
      "issue_date",
      "due_date",
      "subtotal",
      "vat_amount",
      "total_amount",
      "is_credit_note",
      "related_invoice_id",
      "created_at",
    ];

    const rows: ExportRow[] = invoices.map((invoice) => ({
      invoice_id: invoice.id,
      order_id: invoice.orderId ?? null,
      invoice_type: invoice.invoiceType,
      status: invoice.status,
      seller_company_id: invoice.sellerCompanyId,
      buyer_company_id: invoice.buyerCompanyId,
      period: invoice.period,
      issue_date: invoice.issueDate.toISOString(),
      due_date: invoice.dueDate.toISOString(),
      subtotal: invoice.subtotal.toString(),
      vat_amount: invoice.vatAmount.toString(),
      total_amount: invoice.totalAmount.toString(),
      is_credit_note: invoice.isCreditNote ? "true" : "false",
      related_invoice_id: invoice.relatedInvoiceId ?? null,
      created_at: invoice.createdAt.toISOString(),
    }));

    const prefix = options.creditNotes
      ? "credit-notes"
      : options.intercompany
        ? "intercompany-invoices"
        : "invoices";

    return this.buildExportResponse(prefix, columns, rows, query.format);
  }

  private requireHeaders(groupId: string, subsidiaryId: string) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");
  }

  private normalizeFormat(format?: string) {
    return format === "csv" ? "csv" : "json";
  }

  private parseDateRange(query: FinanceExportQueryDto) {
    const range: { gte?: Date; lte?: Date } = {};

    if (query.start_date) range.gte = new Date(query.start_date);
    if (query.end_date) range.lte = new Date(query.end_date);

    if (range.gte && range.lte && range.gte > range.lte) {
      throw new BadRequestException("start_date must be before end_date");
    }

    return Object.keys(range).length ? range : undefined;
  }

  private buildExportResponse(filePrefix: string, columns: string[], rows: ExportRow[], format?: string) {
    const resolvedFormat = this.normalizeFormat(format);
    const generatedAt = new Date().toISOString();
    const response: Record<string, any> = {
      format: resolvedFormat,
      columns,
      meta: {
        row_count: rows.length,
        generated_at: generatedAt,
      },
    };

    if (resolvedFormat === "csv") {
      response.content_type = "text/csv";
      response.file_name = `${filePrefix}-${generatedAt.slice(0, 10)}.csv`;
      response.content = this.toCsv(columns, rows);
    } else {
      response.data = rows;
    }

    return response;
  }

  private toCsv(columns: string[], rows: ExportRow[]) {
    const lines = [columns.join(",")];
    for (const row of rows) {
      const line = columns.map((column) => this.escapeCsv(row[column])).join(",");
      lines.push(line);
    }
    return lines.join("\n");
  }

  private escapeCsv(value: ExportValue) {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (/[",\n]/.test(str)) return `"${str.replace(/"/g, "\"\"")}"`;
    return str;
  }
}
