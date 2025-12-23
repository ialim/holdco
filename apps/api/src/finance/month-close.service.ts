import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CostPoolService } from "./cost-pool.service";
import { IntercompanyInvoicingService } from "./intercompany-invoicing.service";
import { PeriodLockService } from "./period-lock.service";
import { Decimal } from "@prisma/client/runtime/library";
import { AllocationMethod } from "./finance.enums";
import { assertCompanyInGroup } from "./finance-tenancy";

@Injectable()
export class MonthCloseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly costPoolService: CostPoolService,
    private readonly invoicingService: IntercompanyInvoicingService,
    private readonly periodLockService: PeriodLockService,
  ) {}

  async runMonthClose(params: {
    groupId: string;
    holdcoCompanyId: string;
    period: string;
    issueDate: Date;
    dueDays?: number;
    lines: { category: string; amount: Decimal | string | number }[];
    weights: { recipientCompanyId: string; weight: Decimal | string | number }[];
    lockedBy?: string;
  }) {
    await assertCompanyInGroup(this.prisma, params.groupId, params.holdcoCompanyId, "Holding company");
    await this.periodLockService.assertNotLocked(params.holdcoCompanyId, params.period);

    const cp = await this.costPoolService.createCostPool({
      groupId: params.groupId,
      holdcoCompanyId: params.holdcoCompanyId,
      period: params.period,
      lines: params.lines,
      allocationMethod: AllocationMethod.BY_FIXED_SPLIT,
      weights: params.weights,
    });

    await this.costPoolService.allocateCostPool(params.groupId, cp.costPoolId);

    const inv = await this.invoicingService.generateIntercompanyInvoices({
      groupId: params.groupId,
      holdcoCompanyId: params.holdcoCompanyId,
      period: params.period,
      issueDate: params.issueDate,
      dueDays: params.dueDays ?? 30,
    });

    await this.periodLockService.lockPeriod({
      groupId: params.groupId,
      companyId: params.holdcoCompanyId,
      period: params.period,
      lockedBy: params.lockedBy,
      reason: "Month close completed: cost pool, allocations, invoices generated.",
    });

    return { costPool: cp, invoices: inv, locked: true };
  }
}
