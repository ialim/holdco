import { Body, Controller, Get, Headers, Param, Patch, Post, Query, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { CostPoolService } from "./cost-pool.service";
import { IntercompanyInvoicingService } from "./intercompany-invoicing.service";
import { IntercompanyAgreementsService } from "./intercompany-agreements.service";
import { PaymentsService } from "./payments.service";
import { TaxService } from "./tax.service";
import { PeriodLockService } from "./period-lock.service";
import { MonthCloseService } from "./month-close.service";
import { WhtRemittanceService } from "./wht-remittance.service";
import { CreditNoteService } from "./credit-note.service";
import { TaxImpactService } from "./tax-impact.service";
import { ConsolidatedPLService } from "./consolidated-pl.service";
import { LedgerPostingService } from "./ledger-posting.service";
import { AccountingService } from "./accounting.service";
import { FinanceExportsService } from "./finance-exports.service";

import { Permissions } from "../auth/permissions.decorator";
import { PermissionsGuard } from "../auth/permissions.guard";
import { TaxType } from "./finance.enums";
import { ListQueryDto } from "../common/dto/list-query.dto";
import { CreateChartOfAccountDto } from "./dto/create-chart-of-account.dto";
import { CreateCostCenterDto } from "./dto/create-cost-center.dto";
import { CreateFiscalPeriodDto } from "./dto/create-fiscal-period.dto";
import { CreateJournalEntryDto } from "./dto/create-journal-entry.dto";
import { FinanceExportQueryDto } from "./dto/finance-export-query.dto";
import { CreateIntercompanyAgreementDto } from "./dto/create-intercompany-agreement.dto";
import { UpdateIntercompanyAgreementDto } from "./dto/update-intercompany-agreement.dto";
import { TaxProvisionQueryDto } from "./dto/tax-provision-query.dto";
import { FileTaxProvisionDto } from "./dto/file-tax-provision.dto";

@UseGuards(PermissionsGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
@Controller("v1/finance")
export class FinanceController {
  constructor(
    private readonly costPoolService: CostPoolService,
    private readonly invoicingService: IntercompanyInvoicingService,
    private readonly intercompanyAgreementsService: IntercompanyAgreementsService,
    private readonly paymentsService: PaymentsService,
    private readonly taxService: TaxService,
    private readonly periodLockService: PeriodLockService,
    private readonly monthCloseService: MonthCloseService,
    private readonly whtRemittanceService: WhtRemittanceService,
    private readonly creditNoteService: CreditNoteService,
    private readonly taxImpactService: TaxImpactService,
    private readonly consolidatedPLService: ConsolidatedPLService,
    private readonly ledgerPostingService: LedgerPostingService,
    private readonly accountingService: AccountingService,
    private readonly financeExportsService: FinanceExportsService,
  ) {}

  @Permissions("finance.chart_of_accounts.manage")
  @Get("accounts")
  listAccounts(@Headers("x-group-id") groupId: string, @Query() query: ListQueryDto) {
    return this.accountingService.listAccounts(groupId, query);
  }

  @Permissions("finance.chart_of_accounts.manage")
  @Post("accounts")
  createAccount(@Headers("x-group-id") groupId: string, @Body() body: CreateChartOfAccountDto) {
    return this.accountingService.createAccount(groupId, body);
  }

  @Permissions("finance.cost_centers.manage")
  @Get("cost-centers")
  listCostCenters(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Query() query: ListQueryDto,
  ) {
    return this.accountingService.listCostCenters(groupId, subsidiaryId, query);
  }

  @Permissions("finance.cost_centers.manage")
  @Post("cost-centers")
  createCostCenter(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Body() body: CreateCostCenterDto,
  ) {
    return this.accountingService.createCostCenter(groupId, subsidiaryId, body);
  }

  @Permissions("finance.fiscal_periods.manage")
  @Get("fiscal-periods")
  listFiscalPeriods(@Headers("x-group-id") groupId: string, @Query() query: ListQueryDto) {
    return this.accountingService.listFiscalPeriods(groupId, query);
  }

  @Permissions("finance.fiscal_periods.manage")
  @Post("fiscal-periods")
  createFiscalPeriod(@Headers("x-group-id") groupId: string, @Body() body: CreateFiscalPeriodDto) {
    return this.accountingService.createFiscalPeriod(groupId, body);
  }

  @Permissions("finance.journal_entries.manage")
  @Get("journal-entries")
  listJournalEntries(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Query() query: ListQueryDto,
  ) {
    return this.accountingService.listJournalEntries(groupId, subsidiaryId, query);
  }

  @Permissions("finance.journal_entries.manage")
  @Post("journal-entries")
  createJournalEntry(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Body() body: CreateJournalEntryDto,
  ) {
    return this.accountingService.createJournalEntry(groupId, subsidiaryId, body);
  }

  @Permissions("finance.exports.read")
  @Get("exports/journals")
  exportJournalEntries(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Query() query: FinanceExportQueryDto,
  ) {
    return this.financeExportsService.exportJournalEntries(groupId, subsidiaryId, query);
  }

  @Permissions("finance.exports.read")
  @Get("exports/invoices")
  exportInvoices(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Query() query: FinanceExportQueryDto,
  ) {
    return this.financeExportsService.exportInvoices(groupId, subsidiaryId, query);
  }

  @Permissions("finance.exports.read")
  @Get("exports/credit-notes")
  exportCreditNotes(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Query() query: FinanceExportQueryDto,
  ) {
    return this.financeExportsService.exportCreditNotes(groupId, subsidiaryId, query);
  }

  @Permissions("finance.exports.read")
  @Get("exports/intercompany")
  exportIntercompany(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Query() query: FinanceExportQueryDto,
  ) {
    return this.financeExportsService.exportIntercompanyInvoices(groupId, subsidiaryId, query);
  }

  @Permissions("finance.exports.read")
  @Get("exports/payments")
  exportPayments(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Query() query: FinanceExportQueryDto,
  ) {
    return this.financeExportsService.exportPayments(groupId, subsidiaryId, query);
  }

  @Permissions("finance.month_close.run")
  @Post("month-close")
  monthClose(@Headers("x-group-id") groupId: string, @Body() body: any) {
    return this.monthCloseService.runMonthClose({
      groupId,
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
  createCostPool(@Headers("x-group-id") groupId: string, @Body() body: any) {
    return this.costPoolService.createCostPool({ groupId, ...body });
  }

  @Permissions("finance.cost_pools.manage")
  @Post("cost-pools/:id/allocate")
  allocate(@Headers("x-group-id") groupId: string, @Param("id") id: string) {
    return this.costPoolService.allocateCostPool(groupId, id);
  }

  @Permissions("finance.intercompany.agreements.manage")
  @Get("intercompany-agreements")
  listIntercompanyAgreements(@Headers("x-group-id") groupId: string, @Query() query: ListQueryDto) {
    return this.intercompanyAgreementsService.listAgreements(groupId, query);
  }

  @Permissions("finance.intercompany.agreements.manage")
  @Post("intercompany-agreements")
  createIntercompanyAgreement(
    @Headers("x-group-id") groupId: string,
    @Body() body: CreateIntercompanyAgreementDto,
  ) {
    return this.intercompanyAgreementsService.createAgreement(groupId, {
      providerCompanyId: body.provider_company_id,
      recipientCompanyId: body.recipient_company_id,
      type: body.type,
      pricingModel: body.pricing_model,
      markupRate: body.markup_rate,
      fixedFeeAmount: body.fixed_fee_amount,
      vatApplies: body.vat_applies ?? false,
      vatRate: body.vat_rate,
      whtApplies: body.wht_applies ?? false,
      whtRate: body.wht_rate,
      whtTaxType: body.wht_tax_type ?? null,
      effectiveFrom: new Date(body.effective_from),
      effectiveTo: body.effective_to ? new Date(body.effective_to) : null,
    });
  }

  @Permissions("finance.intercompany.agreements.manage")
  @Patch("intercompany-agreements/:id")
  updateIntercompanyAgreement(
    @Headers("x-group-id") groupId: string,
    @Param("id") id: string,
    @Body() body: UpdateIntercompanyAgreementDto,
  ) {
    return this.intercompanyAgreementsService.updateAgreement(groupId, id, {
      providerCompanyId: body.provider_company_id,
      recipientCompanyId: body.recipient_company_id,
      type: body.type,
      pricingModel: body.pricing_model,
      markupRate: body.markup_rate,
      fixedFeeAmount: body.fixed_fee_amount,
      vatApplies: body.vat_applies,
      vatRate: body.vat_rate,
      whtApplies: body.wht_applies,
      whtRate: body.wht_rate,
      whtTaxType: body.wht_tax_type,
      effectiveFrom: body.effective_from ? new Date(body.effective_from) : undefined,
      effectiveTo: body.effective_to ? new Date(body.effective_to) : undefined,
    });
  }

  @Permissions("finance.intercompany.generate")
  @Post("intercompany/:period/generate")
  generate(@Headers("x-group-id") groupId: string, @Param("period") period: string, @Body() body: any) {
    const providerCompanyId = body.providerCompanyId ?? body.holdcoCompanyId;
    return this.invoicingService.generateIntercompanyInvoices({
      groupId,
      holdcoCompanyId: providerCompanyId,
      period,
      issueDate: new Date(body.issueDate),
      dueDays: body.dueDays ?? 30,
      charges: body.charges,
    });
  }

  @Permissions("finance.invoices.issue")
  @Post("invoices/:id/issue")
  issueInvoice(@Headers("x-group-id") groupId: string, @Param("id") id: string) {
    return this.invoicingService.issueInvoice(groupId, id);
  }

  @Permissions("finance.ledger.post")
  @Post("ledger/post-period")
  postPeriod(@Headers("x-group-id") groupId: string, @Body() body: any) {
    return this.ledgerPostingService.postAllInvoicesForPeriod({ groupId, period: body.period });
  }

  @Permissions("finance.payments.record")
  @Post("payments/intercompany")
  recordPayment(@Headers("x-group-id") groupId: string, @Body() body: any) {
    return this.paymentsService.recordIntercompanyPayment({
      groupId,
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
  whtSchedule(
    @Headers("x-group-id") groupId: string,
    @Param("issuerCompanyId") issuerCompanyId: string,
    @Param("period") period: string,
  ) {
    return this.whtRemittanceService.getWhtSchedule({ groupId, issuerCompanyId, period });
  }

  @Permissions("finance.wht.remit")
  @Post("wht-remit")
  whtRemit(@Headers("x-group-id") groupId: string, @Body() body: any) {
    return this.whtRemittanceService.markRemitted({
      groupId,
      issuerCompanyId: body.issuerCompanyId,
      period: body.period,
      taxType: body.taxType as TaxType,
      remittanceDate: new Date(body.remittanceDate),
      firReceiptRef: body.firReceiptRef,
    });
  }

  @Permissions("finance.vat.generate")
  @Get("vat/:companyId/:period")
  vat(@Headers("x-group-id") groupId: string, @Param("companyId") companyId: string, @Param("period") period: string) {
    return this.taxService.generateVatReturn({ groupId, companyId, period });
  }

  @Permissions("finance.tax_provisions.generate")
  @Get("tax-provisions/:companyId/:period")
  taxProvisions(
    @Headers("x-group-id") groupId: string,
    @Param("companyId") companyId: string,
    @Param("period") period: string,
    @Query() query: TaxProvisionQueryDto,
  ) {
    return this.taxService.generateTaxProvisions({
      groupId,
      companyId,
      period,
      incomeTaxRate: query.income_tax_rate,
      educationTaxRate: query.education_tax_rate,
    });
  }

  @Permissions("finance.vat.file")
  @Post("vat/file")
  fileVat(@Headers("x-group-id") groupId: string, @Body() body: any) {
    return this.taxService.fileVatReturn({
      groupId,
      companyId: body.companyId,
      period: body.period,
      paymentRef: body.paymentRef,
    });
  }

  @Permissions("finance.tax_provisions.file")
  @Post("tax-provisions/file")
  fileTaxProvision(@Headers("x-group-id") groupId: string, @Body() body: FileTaxProvisionDto) {
    return this.taxService.fileTaxProvision({
      groupId,
      companyId: body.company_id,
      period: body.period,
      taxType: body.tax_type,
      paymentRef: body.payment_ref,
      paidAt: body.paid_at ? new Date(body.paid_at) : undefined,
    });
  }

  @Permissions("finance.period_lock.manage")
  @Post("period-lock/lock")
  lock(@Headers("x-group-id") groupId: string, @Body() body: any) {
    return this.periodLockService.lockPeriod({ groupId, ...body });
  }

  @Permissions("finance.period_lock.manage")
  @Post("period-lock/unlock")
  unlock(@Headers("x-group-id") groupId: string, @Body() body: any) {
    return this.periodLockService.unlockPeriod({ groupId, ...body });
  }

  @Permissions("finance.credit_notes.manage")
  @Post("credit-notes")
  createCredit(@Headers("x-group-id") groupId: string, @Body() body: any) {
    return this.creditNoteService.createCreditNote({
      groupId,
      originalInvoiceId: body.originalInvoiceId,
      issueDate: new Date(body.issueDate),
      reason: body.reason,
      fullReversal: body.fullReversal,
      lines: body.lines,
    });
  }

  @Permissions("finance.tax_impact.read")
  @Get("tax-impact/:companyId/:period")
  taxImpact(@Headers("x-group-id") groupId: string, @Param("companyId") companyId: string, @Param("period") period: string) {
    return this.taxImpactService.companyTaxImpact({ groupId, companyId, period });
  }

  @Permissions("finance.consolidated_pl.read")
  @Get("reports/consolidated-pl/:period")
  consolidatedPL(@Headers("x-group-id") groupId: string, @Param("period") period: string) {
    return this.consolidatedPLService.consolidatedPL({ groupId, period, excludeIntercompanyAccounts: true });
  }
}
