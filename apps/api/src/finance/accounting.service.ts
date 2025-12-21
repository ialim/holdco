import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ListQueryDto } from "../common/dto/list-query.dto";
import { CreateChartOfAccountDto } from "./dto/create-chart-of-account.dto";
import { CreateCostCenterDto } from "./dto/create-cost-center.dto";
import { CreateFiscalPeriodDto } from "./dto/create-fiscal-period.dto";
import { CreateJournalEntryDto } from "./dto/create-journal-entry.dto";

@Injectable()
export class AccountingService {
  constructor(private readonly prisma: PrismaService) {}

  async listAccounts(groupId: string, query: ListQueryDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");

    const where = { groupId };

    const [total, accounts] = await this.prisma.$transaction([
      this.prisma.chartOfAccount.count({ where }),
      this.prisma.chartOfAccount.findMany({
        where,
        orderBy: { code: "asc" },
        skip: query.offset ?? 0,
        take: query.limit ?? 50,
      }),
    ]);

    return {
      data: accounts.map((account) => this.mapChartOfAccount(account)),
      meta: this.buildMeta(query, total),
    };
  }

  async createAccount(groupId: string, body: CreateChartOfAccountDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");

    const account = await this.prisma.chartOfAccount.create({
      data: {
        groupId,
        code: body.code,
        name: body.name,
        type: body.type,
        parentId: body.parent_id,
      },
    });

    return this.mapChartOfAccount(account);
  }

  async listCostCenters(groupId: string, subsidiaryId: string, query: ListQueryDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const where = { groupId, subsidiaryId };

    const [total, centers] = await this.prisma.$transaction([
      this.prisma.costCenter.count({ where }),
      this.prisma.costCenter.findMany({
        where,
        orderBy: { code: "asc" },
        skip: query.offset ?? 0,
        take: query.limit ?? 50,
      }),
    ]);

    return {
      data: centers.map((center) => this.mapCostCenter(center)),
      meta: this.buildMeta(query, total),
    };
  }

  async createCostCenter(groupId: string, subsidiaryId: string, body: CreateCostCenterDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const center = await this.prisma.costCenter.create({
      data: {
        groupId,
        subsidiaryId,
        code: body.code,
        name: body.name,
      },
    });

    return this.mapCostCenter(center);
  }

  async listFiscalPeriods(groupId: string, query: ListQueryDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");

    const where = { groupId };

    const [total, periods] = await this.prisma.$transaction([
      this.prisma.fiscalPeriod.count({ where }),
      this.prisma.fiscalPeriod.findMany({
        where,
        orderBy: { startDate: "desc" },
        skip: query.offset ?? 0,
        take: query.limit ?? 50,
      }),
    ]);

    return {
      data: periods.map((period) => this.mapFiscalPeriod(period)),
      meta: this.buildMeta(query, total),
    };
  }

  async createFiscalPeriod(groupId: string, body: CreateFiscalPeriodDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");

    const period = await this.prisma.fiscalPeriod.create({
      data: {
        groupId,
        name: body.name,
        startDate: new Date(body.start_date),
        endDate: new Date(body.end_date),
        status: body.status ?? "open",
      },
    });

    return this.mapFiscalPeriod(period);
  }

  async listJournalEntries(groupId: string, subsidiaryId: string, query: ListQueryDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const where = { groupId, subsidiaryId };

    const [total, entries] = await this.prisma.$transaction([
      this.prisma.journalEntry.count({ where }),
      this.prisma.journalEntry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: query.offset ?? 0,
        take: query.limit ?? 50,
      }),
    ]);

    return {
      data: entries.map((entry) => this.mapJournalEntry(entry)),
      meta: this.buildMeta(query, total),
    };
  }

  async createJournalEntry(groupId: string, subsidiaryId: string, body: CreateJournalEntryDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");
    if (!body.lines?.length) throw new BadRequestException("Journal entry lines are required");

    const lines = body.lines.map((line) => {
      const debit = line.debit ?? 0;
      const credit = line.credit ?? 0;
      if (debit < 0 || credit < 0) {
        throw new BadRequestException("Journal line amounts must be non-negative");
      }
      if (debit === 0 && credit === 0) {
        throw new BadRequestException("Journal line must include a debit or credit amount");
      }
      return {
        accountId: line.account_id,
        costCenterId: line.cost_center_id,
        description: line.description,
        debit,
        credit,
      };
    });

    const entry = await this.prisma.journalEntry.create({
      data: {
        groupId,
        subsidiaryId,
        fiscalPeriodId: body.fiscal_period_id,
        reference: body.reference,
        memo: body.memo,
        lines: { create: lines },
      },
    });

    return this.mapJournalEntry(entry);
  }

  private mapChartOfAccount(account: { id: string; code: string; name: string; type: string; parentId: string | null }) {
    return {
      id: account.id,
      code: account.code,
      name: account.name,
      type: account.type,
      parent_id: account.parentId ?? undefined,
    };
  }

  private mapCostCenter(center: { id: string; code: string; name: string; status: string }) {
    return {
      id: center.id,
      code: center.code,
      name: center.name,
      status: center.status,
    };
  }

  private mapFiscalPeriod(period: { id: string; name: string; startDate: Date; endDate: Date; status: string }) {
    return {
      id: period.id,
      name: period.name,
      start_date: this.formatDate(period.startDate),
      end_date: this.formatDate(period.endDate),
      status: period.status,
    };
  }

  private mapJournalEntry(entry: { id: string; fiscalPeriodId: string; reference: string | null; status: string; postedAt: Date | null }) {
    return {
      id: entry.id,
      fiscal_period_id: entry.fiscalPeriodId,
      reference: entry.reference ?? undefined,
      status: entry.status,
      posted_at: entry.postedAt ? entry.postedAt.toISOString() : undefined,
    };
  }

  private buildMeta(query: ListQueryDto, total: number) {
    return {
      limit: query.limit ?? 50,
      offset: query.offset ?? 0,
      total,
    };
  }

  private formatDate(value: Date | null) {
    return value ? value.toISOString().slice(0, 10) : undefined;
  }
}
