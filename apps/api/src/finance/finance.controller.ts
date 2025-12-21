import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { CostPoolService } from "./cost-pool.service";
import { IntercompanyInvoicingService } from "./intercompany-invoicing.service";
import { PaymentsService } from "./payments.service";
import { TaxService } from "./tax.service";
import { PeriodLockService } from "./period-lock.service";
import { MonthCloseService } from "./month-close.service";
import { WhtRemittanceService } from "./wht-remittance.service";
import { CreditNoteService } from "./credit-note.service";
import { TaxImpactService } from "./tax-impact.service";
import { ConsolidatedPLService } from "./consolidated-pl.service";
import { LedgerPostingService } from "./ledger-posting.service";

import { Permissions } from "../auth/permissions.decorator";
import { PermissionsGuard } from "../auth/permissions.guard";
import { TaxType } from "./finance.enums";

@UseGuards(PermissionsGuard)
@Controller("v1/finance")
export class FinanceController {
  constructor(
    private readonly costPoolService: CostPoolService,
    private readonly invoicingService: IntercompanyInvoicingService,
    private readonly paymentsService: PaymentsService,
    private readonly taxService: TaxService,
    private readonly periodLockService: PeriodLockService,
    private readonly monthCloseService: MonthCloseService,
    private readonly whtRemittanceService: WhtRemittanceService,
    private readonly creditNoteService: CreditNoteService,
    private readonly taxImpactService: TaxImpactService,
    private readonly consolidatedPLService: ConsolidatedPLService,
    private readonly ledgerPostingService: LedgerPostingService,
  ) {}

  @Permissions("finance.month_close.run")
  @Post("month-close")
  monthClose(@Body() body: any) {
    return this.monthCloseService.runMonthClose({
      holdcoCompanyId: body.holdcoCompanyId,
      period: body.period,
      issueDate: new Date(body.issueDate),
      dueDays: body.dueDays ?? 30,
      lines: body.lines,
      weights: body.weights,
      lockedBy: body.lockedBy,
    });
  }

  @Permissions("finance.cost_pools.manage")
  @Post("cost-pools")
  createCostPool(@Body() body: any) {
    return this.costPoolService.createCostPool(body);
  }

  @Permissions("finance.cost_pools.manage")
  @Post("cost-pools/:id/allocate")
  allocate(@Param("id") id: string) {
    return this.costPoolService.allocateCostPool(id);
  }

  @Permissions("finance.intercompany.generate")
  @Post("intercompany/:period/generate")
  generate(@Param("period") period: string, @Body() body: any) {
    return this.invoicingService.generateIntercompanyInvoices({
      holdcoCompanyId: body.holdcoCompanyId,
      period,
      issueDate: new Date(body.issueDate),
      dueDays: body.dueDays ?? 30,
    });
  }

  @Permissions("finance.invoices.issue")
  @Post("invoices/:id/issue")
  issueInvoice(@Param("id") id: string) {
    return this.invoicingService.issueInvoice(id);
  }

  @Permissions("finance.ledger.post")
  @Post("ledger/post-period")
  postPeriod(@Body() body: any) {
    return this.ledgerPostingService.postAllInvoicesForPeriod({ period: body.period });
  }

  @Permissions("finance.payments.record")
  @Post("payments/intercompany")
  recordPayment(@Body() body: any) {
    return this.paymentsService.recordIntercompanyPayment({
      invoiceId: body.invoiceId,
      paymentDate: new Date(body.paymentDate),
      amountPaid: body.amountPaid,
      whtWithheldAmount: body.whtWithheldAmount,
      reference: body.reference,
      notes: body.notes,
    });
  }

  @Permissions("finance.wht.schedule.read")
  @Get("wht-schedule/:issuerCompanyId/:period")
  whtSchedule(@Param("issuerCompanyId") issuerCompanyId: string, @Param("period") period: string) {
    return this.whtRemittanceService.getWhtSchedule({ issuerCompanyId, period });
  }

  @Permissions("finance.wht.remit")
  @Post("wht-remit")
  whtRemit(@Body() body: any) {
    return this.whtRemittanceService.markRemitted({
      issuerCompanyId: body.issuerCompanyId,
      period: body.period,
      taxType: body.taxType as TaxType,
      remittanceDate: new Date(body.remittanceDate),
      firReceiptRef: body.firReceiptRef,
    });
  }

  @Permissions("finance.vat.generate")
  @Get("vat/:companyId/:period")
  vat(@Param("companyId") companyId: string, @Param("period") period: string) {
    return this.taxService.generateVatReturn({ companyId, period });
  }

  @Permissions("finance.vat.file")
  @Post("vat/file")
  fileVat(@Body() body: any) {
    return this.taxService.fileVatReturn({ companyId: body.companyId, period: body.period, paymentRef: body.paymentRef });
  }

  @Permissions("finance.period_lock.manage")
  @Post("period-lock/lock")
  lock(@Body() body: any) {
    return this.periodLockService.lockPeriod(body);
  }

  @Permissions("finance.period_lock.manage")
  @Post("period-lock/unlock")
  unlock(@Body() body: any) {
    return this.periodLockService.unlockPeriod(body);
  }

  @Permissions("finance.credit_notes.manage")
  @Post("credit-notes")
  createCredit(@Body() body: any) {
    return this.creditNoteService.createCreditNote({
      originalInvoiceId: body.originalInvoiceId,
      issueDate: new Date(body.issueDate),
      reason: body.reason,
      fullReversal: body.fullReversal,
      lines: body.lines,
    });
  }

  @Permissions("finance.tax_impact.read")
  @Get("tax-impact/:companyId/:period")
  taxImpact(@Param("companyId") companyId: string, @Param("period") period: string) {
    return this.taxImpactService.companyTaxImpact({ companyId, period });
  }

  @Permissions("finance.consolidated_pl.read")
  @Get("reports/consolidated-pl/:period")
  consolidatedPL(@Param("period") period: string) {
    return this.consolidatedPLService.consolidatedPL({ period, excludeIntercompanyAccounts: true });
  }
}
