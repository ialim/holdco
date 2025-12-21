import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ListQueryDto } from "../common/dto/list-query.dto";
import { CreateResellerDto } from "./dto/create-reseller.dto";
import { CreateCreditAccountDto } from "./dto/create-credit-account.dto";
import { CreditLimitDto } from "./dto/credit-limit.dto";
import { CreateRepaymentDto } from "./dto/create-repayment.dto";

@Injectable()
export class CreditService {
  constructor(private readonly prisma: PrismaService) {}

  async listResellers(groupId: string, subsidiaryId: string, query: ListQueryDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const where = {
      groupId,
      subsidiaryId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.q
        ? {
            name: {
              contains: query.q,
              mode: "insensitive" as const,
            },
          }
        : {}),
    };

    const [total, resellers] = await this.prisma.$transaction([
      this.prisma.reseller.count({ where }),
      this.prisma.reseller.findMany({ where, orderBy: { name: "asc" }, skip: query.offset ?? 0, take: query.limit ?? 50 }),
    ]);

    return {
      data: resellers.map((reseller: any) => ({
        id: reseller.id,
        name: reseller.name,
        status: reseller.status,
      })),
      meta: this.buildMeta(query, total),
    };
  }

  async createReseller(groupId: string, subsidiaryId: string, body: CreateResellerDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const reseller = await this.prisma.reseller.create({
      data: {
        groupId,
        subsidiaryId,
        name: body.name,
        status: body.status ?? "active",
      },
    });

    return {
      id: reseller.id,
      name: reseller.name,
      status: reseller.status,
    };
  }

  async listCreditAccounts(groupId: string, subsidiaryId: string, query: ListQueryDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const where = {
      groupId,
      subsidiaryId,
      ...(query.status ? { status: query.status } : {}),
    };

    const [total, accounts] = await this.prisma.$transaction([
      this.prisma.creditAccount.count({ where }),
      this.prisma.creditAccount.findMany({ where, orderBy: { createdAt: "desc" }, skip: query.offset ?? 0, take: query.limit ?? 50 }),
    ]);

    return {
      data: accounts.map((account: any) => ({
        id: account.id,
        reseller_id: account.resellerId,
        limit_amount: Number(account.limitAmount),
        used_amount: Number(account.usedAmount),
        status: account.status,
      })),
      meta: this.buildMeta(query, total),
    };
  }

  async createCreditAccount(groupId: string, subsidiaryId: string, body: CreateCreditAccountDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const account = await this.prisma.creditAccount.create({
      data: {
        groupId,
        subsidiaryId,
        resellerId: body.reseller_id,
        limitAmount: body.limit_amount,
      },
    });

    return {
      id: account.id,
      reseller_id: account.resellerId,
      limit_amount: Number(account.limitAmount),
      used_amount: Number(account.usedAmount),
      status: account.status,
    };
  }

  async updateCreditLimit(groupId: string, subsidiaryId: string, body: CreditLimitDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const existing = await this.prisma.creditAccount.findFirst({
      where: { groupId, subsidiaryId, resellerId: body.reseller_id },
    });

    if (!existing) {
      const created = await this.prisma.creditAccount.create({
        data: {
          groupId,
          subsidiaryId,
          resellerId: body.reseller_id,
          limitAmount: body.limit_amount,
        },
      });

      return {
        id: created.id,
        reseller_id: created.resellerId,
        limit_amount: Number(created.limitAmount),
        used_amount: Number(created.usedAmount),
        status: created.status,
      };
    }

    const account = await this.prisma.creditAccount.update({
      where: { id: existing.id },
      data: { limitAmount: body.limit_amount },
    });

    return {
      id: account.id,
      reseller_id: account.resellerId,
      limit_amount: Number(account.limitAmount),
      used_amount: Number(account.usedAmount),
      status: account.status,
    };
  }

  async createRepayment(groupId: string, subsidiaryId: string, body: CreateRepaymentDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const account = await this.prisma.creditAccount.findFirst({
      where: { id: body.credit_account_id, groupId, subsidiaryId },
    });

    if (!account) throw new NotFoundException("Credit account not found");

    const repayment = await this.prisma.repayment.create({
      data: {
        groupId,
        subsidiaryId,
        creditAccountId: body.credit_account_id,
        amount: body.amount,
        paidAt: body.paid_at ? new Date(body.paid_at) : new Date(),
      },
    });

    return {
      id: repayment.id,
      credit_account_id: repayment.creditAccountId,
      amount: Number(repayment.amount),
      paid_at: repayment.paidAt.toISOString(),
    };
  }

  private buildMeta(query: ListQueryDto, total: number) {
    return {
      limit: query.limit ?? 50,
      offset: query.offset ?? 0,
      total,
    };
  }
}
