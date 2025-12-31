import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";

import { FinanceController } from "./finance.controller";
import { CostPoolService } from "./cost-pool.service";
import { IntercompanyAgreementsService } from "./intercompany-agreements.service";
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
import { AccountingService } from "./accounting.service";
import { FinanceExportsService } from "./finance-exports.service";

@Module({
  imports: [PrismaModule],
  controllers: [FinanceController],
  providers: [
    CostPoolService,
    LedgerPostingService,
    IntercompanyAgreementsService,
    IntercompanyInvoicingService,
    PaymentsService,
    TaxService,
    PeriodLockService,
    MonthCloseService,
    WhtRemittanceService,
    CreditNoteService,
    TaxImpactService,
    ConsolidatedPLService,
    AccountingService,
    FinanceExportsService,
  ],
  exports: [
    CostPoolService,
    LedgerPostingService,
    IntercompanyAgreementsService,
    IntercompanyInvoicingService,
    PaymentsService,
    TaxService,
    PeriodLockService,
    MonthCloseService,
    WhtRemittanceService,
    CreditNoteService,
    TaxImpactService,
    ConsolidatedPLService,
    AccountingService,
    FinanceExportsService,
  ],
})
export class FinanceModule {}
