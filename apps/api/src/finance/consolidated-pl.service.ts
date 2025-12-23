import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Decimal } from "@prisma/client/runtime/library";
import { LedgerAccountType } from "./finance.enums";
import { requireGroupId } from "./finance-tenancy";

function dec(v: any) { return new Decimal(v); }
function round2(d: Decimal) { return new Decimal(d.toFixed(2)); }

@Injectable()
export class ConsolidatedPLService {
  constructor(private readonly prisma: PrismaService) {}

  async consolidatedPL(params: { groupId: string; period: string; excludeIntercompanyAccounts?: boolean }) {
    requireGroupId(params.groupId);
    const excludeIC = params.excludeIntercompanyAccounts ?? true;

    const entries = await this.prisma.ledgerEntry.findMany({
      where: { period: params.period, company: { groupId: params.groupId } },
      include: { account: true },
    });

    const filtered = excludeIC
      ? entries.filter((e: any) => !["IC_REV", "IC_EXP"].includes(e.account.code))
      : entries;

    let revenue = dec(0);
    let cogs = dec(0);
    let expense = dec(0);

    for (const e of filtered) {
      const amount = dec(e.credit).minus(dec(e.debit));
      if (e.account.type === LedgerAccountType.REVENUE) revenue = revenue.plus(amount);
      if (e.account.type === LedgerAccountType.COGS) cogs = cogs.plus(amount.abs());
      if (e.account.type === LedgerAccountType.EXPENSE) expense = expense.plus(amount.abs());
    }

    revenue = round2(revenue);
    cogs = round2(cogs);
    expense = round2(expense);

    const grossProfit = round2(revenue.minus(cogs));
    const netProfit = round2(grossProfit.minus(expense));

    return { period: params.period, revenue: revenue.toString(), cogs: cogs.toString(), grossProfit: grossProfit.toString(), operatingExpenses: expense.toString(), netProfit: netProfit.toString(), note: excludeIC ? "Intercompany accounts (IC_REV, IC_EXP) excluded." : "Includes intercompany accounts." };
  }
}
