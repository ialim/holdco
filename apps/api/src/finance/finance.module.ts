import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";

import { FinanceController } from "./finance.controller";
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

@Module({
  imports: [PrismaModule],
  controllers: [FinanceController],
  providers: [
    CostPoolService,
    LedgerPostingService,
    IntercompanyInvoicingService,
    PaymentsService,
    TaxService,
    PeriodLockService,
    MonthCloseService,
    WhtRemittanceService,
    CreditNoteService,
    TaxImpactService,
    ConsolidatedPLService,
  ],
  exports: [
    CostPoolService,
    LedgerPostingService,
    IntercompanyInvoicingService,
    PaymentsService,
    TaxService,
    PeriodLockService,
    MonthCloseService,
    WhtRemittanceService,
    CreditNoteService,
    TaxImpactService,
    ConsolidatedPLService,
  ],
})
export class FinanceModule {}
