import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { Decimal } from "@prisma/client/runtime/library";
import { InvoiceStatus, LedgerAccountType, TaxProvisionType } from "./finance.enums";
import { assertPostingCodeAllowed } from "./ledger-code-rules";
import { assertCompanyInGroup, requireGroupId } from "./finance-tenancy";

function dec(v: any) { return new Decimal(v); }
function round2(d: Decimal) { return new Decimal(d.toFixed(2)); }

const DEFAULT_INCOME_TAX_RATE = new Decimal("0.30");
const DEFAULT_EDUCATION_TAX_RATE = new Decimal("0.025");
const TAX_PROVISION_SOURCE = "TAX_PROVISION";

const TAX_LEDGER_CODES = {
  incomeExpense: "TAX_CIT_EXP",
  incomePayable: "TAX_CIT_PAY",
  educationExpense: "TAX_EDU_EXP",
  educationPayable: "TAX_EDU_PAY",
};

type DbClient = Prisma.TransactionClient | PrismaService;

@Injectable()
export class TaxService {
  constructor(private readonly prisma: PrismaService) {}

  async generateVatReturn(params: { groupId: string; companyId: string; period: string }) {
    requireGroupId(params.groupId);
    await assertCompanyInGroup(this.prisma, params.groupId, params.companyId);

    const sold = await this.prisma.invoice.findMany({
      where: { sellerCompanyId: params.companyId, period: params.period, status: { not: InvoiceStatus.VOID } },
      select: { vatAmount: true },
    });

    const bought = await this.prisma.invoice.findMany({
      where: { buyerCompanyId: params.companyId, period: params.period, status: { not: InvoiceStatus.VOID } },
      select: { vatAmount: true },
    });

    const outputVat = round2(sold.reduce((s: any, i: any) => s.plus(dec(i.vatAmount)), dec(0)));
    const inputVat = round2(bought.reduce((s: any, i: any) => s.plus(dec(i.vatAmount)), dec(0)));
    const net = round2(outputVat.minus(inputVat));

    return this.prisma.vatReturn.upsert({
      where: { companyId_period: { companyId: params.companyId, period: params.period } },
      update: { outputVat, inputVat, netVatPayable: net },
      create: { companyId: params.companyId, period: params.period, outputVat, inputVat, netVatPayable: net },
    });
  }

  async fileVatReturn(params: { groupId: string; companyId: string; period: string; paymentRef?: string }) {
    requireGroupId(params.groupId);
    await assertCompanyInGroup(this.prisma, params.groupId, params.companyId);

    const vr = await this.prisma.vatReturn.findFirst({
      where: {
        companyId: params.companyId,
        period: params.period,
        company: { groupId: params.groupId },
      },
    });
    if (!vr) throw new Error("VAT return not generated yet");

    return this.prisma.vatReturn.update({
      where: { id: vr.id },
      data: { status: "FILED", filedAt: new Date(), paymentRef: params.paymentRef ?? vr.paymentRef },
    });
  }

  async generateTaxProvisions(params: {
    groupId: string;
    companyId: string;
    period: string;
    incomeTaxRate?: number;
    educationTaxRate?: number;
  }) {
    requireGroupId(params.groupId);
    await assertCompanyInGroup(this.prisma, params.groupId, params.companyId);

    const profit = await this.calculateCompanyProfit(params.companyId, params.period, true);
    const taxableProfit = profit.netProfit.greaterThan(0) ? profit.netProfit : dec(0);
    const incomeRate = dec(params.incomeTaxRate ?? DEFAULT_INCOME_TAX_RATE)!;
    const educationRate = dec(params.educationTaxRate ?? DEFAULT_EDUCATION_TAX_RATE)!;

    const incomeAmount = round2(taxableProfit.mul(incomeRate));
    const educationAmount = round2(taxableProfit.mul(educationRate));

    const [incomeProvision, educationProvision] = await this.prisma.$transaction(async (tx) => {
      const incomeProvision = await tx.taxProvision.upsert({
        where: { companyId_period_taxType: { companyId: params.companyId, period: params.period, taxType: TaxProvisionType.INCOME_TAX } },
        update: {
          taxableProfit,
          taxRate: incomeRate,
          amount: incomeAmount,
          status: "PROVISIONED",
        },
        create: {
          companyId: params.companyId,
          period: params.period,
          taxType: TaxProvisionType.INCOME_TAX,
          taxableProfit,
          taxRate: incomeRate,
          amount: incomeAmount,
          status: "PROVISIONED",
        },
      });

      const educationProvision = await tx.taxProvision.upsert({
        where: { companyId_period_taxType: { companyId: params.companyId, period: params.period, taxType: TaxProvisionType.EDUCATION_TAX } },
        update: {
          taxableProfit,
          taxRate: educationRate,
          amount: educationAmount,
          status: "PROVISIONED",
        },
        create: {
          companyId: params.companyId,
          period: params.period,
          taxType: TaxProvisionType.EDUCATION_TAX,
          taxableProfit,
          taxRate: educationRate,
          amount: educationAmount,
          status: "PROVISIONED",
        },
      });

      await this.postTaxProvisionToLedger(tx, incomeProvision, TAX_LEDGER_CODES.incomeExpense, TAX_LEDGER_CODES.incomePayable, "Income tax");
      await this.postTaxProvisionToLedger(tx, educationProvision, TAX_LEDGER_CODES.educationExpense, TAX_LEDGER_CODES.educationPayable, "Education tax");

      return [incomeProvision, educationProvision];
    });

    return {
      companyId: params.companyId,
      period: params.period,
      taxableProfit: taxableProfit.toString(),
      incomeTax: {
        amount: incomeProvision.amount.toString(),
        rate: incomeProvision.taxRate.toString(),
        status: incomeProvision.status,
      },
      educationTax: {
        amount: educationProvision.amount.toString(),
        rate: educationProvision.taxRate.toString(),
        status: educationProvision.status,
      },
    };
  }

  async fileTaxProvision(params: {
    groupId: string;
    companyId: string;
    period: string;
    taxType: TaxProvisionType;
    paymentRef?: string;
    paidAt?: Date;
  }) {
    requireGroupId(params.groupId);
    await assertCompanyInGroup(this.prisma, params.groupId, params.companyId);

    const provision = await this.prisma.taxProvision.findFirst({
      where: {
        companyId: params.companyId,
        period: params.period,
        taxType: params.taxType,
        company: { groupId: params.groupId },
      },
    });
    if (!provision) throw new BadRequestException("Tax provision not generated yet");

    return this.prisma.taxProvision.update({
      where: { id: provision.id },
      data: {
        status: "PAID",
        paidAt: params.paidAt ?? new Date(),
        paymentRef: params.paymentRef ?? provision.paymentRef,
      },
    });
  }

  private async calculateCompanyProfit(companyId: string, period: string, excludeIntercompanyAccounts: boolean) {
    const entries = await this.prisma.ledgerEntry.findMany({
      where: { companyId, period },
      include: { account: true },
    });

    const filtered = excludeIntercompanyAccounts
      ? entries.filter((entry: any) => !["IC_REV", "IC_EXP"].includes(entry.account.code))
      : entries;

    let revenue = dec(0);
    let cogs = dec(0);
    let expense = dec(0);

    for (const entry of filtered) {
      const amount = dec(entry.credit).minus(dec(entry.debit));
      if (entry.account.type === LedgerAccountType.REVENUE) revenue = revenue.plus(amount);
      if (entry.account.type === LedgerAccountType.COGS) cogs = cogs.plus(amount.abs());
      if (entry.account.type === LedgerAccountType.EXPENSE) expense = expense.plus(amount.abs());
    }

    revenue = round2(revenue);
    cogs = round2(cogs);
    expense = round2(expense);

    const grossProfit = round2(revenue.minus(cogs));
    const netProfit = round2(grossProfit.minus(expense));

    return { revenue, cogs, expense, netProfit };
  }

  private async postTaxProvisionToLedger(
    db: DbClient,
    provision: { id: string; companyId: string; period: string; amount: Decimal },
    expenseCode: string,
    payableCode: string,
    label: string,
  ) {
    await db.ledgerEntry.deleteMany({ where: { sourceType: TAX_PROVISION_SOURCE, sourceRef: provision.id } });

    const amount = dec(provision.amount) ?? dec(0);
    if (amount.lte(0)) return;

    const [expenseAccountId, payableAccountId] = await Promise.all([
      this.getLedgerAccountId(db, provision.companyId, expenseCode),
      this.getLedgerAccountId(db, provision.companyId, payableCode),
    ]);

    const entryDate = new Date();
    const memo = `${label} provision (${provision.period})`;
    const zero = dec(0);

    await db.ledgerEntry.create({
      data: {
        companyId: provision.companyId,
        period: provision.period,
        entryDate,
        accountId: expenseAccountId,
        debit: amount,
        credit: zero,
        memo,
        sourceType: TAX_PROVISION_SOURCE,
        sourceRef: provision.id,
      },
    });

    await db.ledgerEntry.create({
      data: {
        companyId: provision.companyId,
        period: provision.period,
        entryDate,
        accountId: payableAccountId,
        debit: zero,
        credit: amount,
        memo,
        sourceType: TAX_PROVISION_SOURCE,
        sourceRef: provision.id,
      },
    });
  }

  private async getLedgerAccountId(db: DbClient, companyId: string, code: string) {
    assertPostingCodeAllowed(code);
    const account = await db.ledgerAccount.findUnique({ where: { companyId_code: { companyId, code } } });
    if (!account) throw new BadRequestException(`Ledger account ${code} missing for company ${companyId}`);
    return account.id;
  }
}
