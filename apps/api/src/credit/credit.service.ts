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

  async getReseller(groupId: string, subsidiaryId: string, resellerId: string) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const reseller = await this.prisma.reseller.findFirst({
      where: { id: resellerId, groupId, subsidiaryId },
    });

    if (!reseller) throw new NotFoundException("Reseller not found");

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
      ...(query.reseller_id ? { resellerId: query.reseller_id } : {}),
      ...(query.status ? { status: query.status } : {}),
    };

    const [total, accounts] = await this.prisma.$transaction([
      this.prisma.creditAccount.count({ where }),
      this.prisma.creditAccount.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: query.offset ?? 0,
        take: query.limit ?? 50,
        include: { reseller: true },
      }),
    ]);

    return {
      data: accounts.map((account: any) => ({
        id: account.id,
        reseller_id: account.resellerId,
        reseller_name: account.reseller?.name ?? undefined,
        limit_amount: Number(account.limitAmount),
        used_amount: Number(account.usedAmount),
        available_amount: Math.max(0, Number(account.limitAmount) - Number(account.usedAmount)),
        status: account.status,
        updated_at: account.updatedAt.toISOString(),
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
      available_amount: Math.max(0, Number(account.limitAmount) - Number(account.usedAmount)),
      status: account.status,
      updated_at: account.updatedAt.toISOString(),
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
        available_amount: Math.max(0, Number(created.limitAmount) - Number(created.usedAmount)),
        status: created.status,
        updated_at: created.updatedAt.toISOString(),
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
      available_amount: Math.max(0, Number(account.limitAmount) - Number(account.usedAmount)),
      status: account.status,
      updated_at: account.updatedAt.toISOString(),
    };
  }

  async reserveCreditUsage(params: {
    groupId: string;
    subsidiaryId: string;
    resellerId: string;
    amount: number;
    allowOverride?: boolean;
  }) {
    if (!params.groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!params.subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    return this.prisma.$transaction(async (tx) => {
      const account = await tx.creditAccount.findFirst({
        where: {
          groupId: params.groupId,
          subsidiaryId: params.subsidiaryId,
          resellerId: params.resellerId,
          status: "active",
        },
      });

      if (!account) throw new NotFoundException("Credit account not found");

      const limitAmount = Number(account.limitAmount);
      const usedAmount = Number(account.usedAmount);
      const available = limitAmount - usedAmount;

      if (!params.allowOverride && available < params.amount) {
        throw new BadRequestException({
          message: "Credit limit exceeded",
          code: "credit.limit.exceeded",
          available,
          required: params.amount,
        });
      }

      const updated = await tx.creditAccount.update({
        where: { id: account.id },
        data: { usedAmount: usedAmount + params.amount },
      });

      return {
        id: updated.id,
        reseller_id: updated.resellerId,
        limit_amount: Number(updated.limitAmount),
        used_amount: Number(updated.usedAmount),
        available_amount: Math.max(0, Number(updated.limitAmount) - Number(updated.usedAmount)),
        status: updated.status,
      };
    });
  }

  async releaseCreditUsage(params: {
    groupId: string;
    subsidiaryId: string;
    resellerId: string;
    amount: number;
  }) {
    if (!params.groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!params.subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");
    if (params.amount <= 0) return;

    return this.prisma.$transaction(async (tx) => {
      const account = await tx.creditAccount.findFirst({
        where: {
          groupId: params.groupId,
          subsidiaryId: params.subsidiaryId,
          resellerId: params.resellerId,
        },
      });

      if (!account) return;

      const nextUsed = Math.max(0, Number(account.usedAmount) - params.amount);
      const updated = await tx.creditAccount.update({
        where: { id: account.id },
        data: { usedAmount: nextUsed },
      });

      return {
        id: updated.id,
        reseller_id: updated.resellerId,
        limit_amount: Number(updated.limitAmount),
        used_amount: Number(updated.usedAmount),
        available_amount: Math.max(0, Number(updated.limitAmount) - Number(updated.usedAmount)),
        status: updated.status,
      };
    });
  }

  async createRepayment(groupId: string, subsidiaryId: string, body: CreateRepaymentDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    return this.prisma.$transaction(async (tx) => {
      const account = await tx.creditAccount.findFirst({
        where: { id: body.credit_account_id, groupId, subsidiaryId },
      });

      if (!account) throw new NotFoundException("Credit account not found");

      const repayment = await tx.repayment.create({
        data: {
          groupId,
          subsidiaryId,
          creditAccountId: body.credit_account_id,
          amount: body.amount,
          unappliedAmount: body.amount,
          paidAt: body.paid_at ? new Date(body.paid_at) : new Date(),
          method: body.method,
        },
      });

      const orders = await tx.order.findMany({
        where: {
          groupId,
          subsidiaryId,
          resellerId: account.resellerId,
          channel: "wholesale",
          status: { not: "cancelled" },
        },
        orderBy: { createdAt: "asc" },
      });

      let remaining = body.amount;
      const allocations: Array<{ order_id: string; amount: number }> = [];

      for (const order of orders) {
        if (remaining <= 0) break;
        const totalAmount = Number(order.totalAmount);
        const paidAmount = Number(order.paidAmount ?? 0);
        const balance = totalAmount - paidAmount;
        if (balance <= 0) continue;

        const applied = Math.min(balance, remaining);
        remaining -= applied;

        await tx.orderPayment.create({
          data: {
            groupId,
            subsidiaryId,
            orderId: order.id,
            method: "credit",
            paymentType: "credit",
            amount: applied,
            currency: order.currency,
            status: "captured",
            provider: "credit",
            reference: repayment.id,
          },
        });

        const nextPaid = paidAmount + applied;
        const paymentStatus =
          nextPaid >= totalAmount ? "paid" : nextPaid > 0 ? "partial" : "unpaid";
        await tx.order.update({
          where: { id: order.id },
          data: { paidAmount: nextPaid, paymentStatus },
        });

        await tx.repaymentAllocation.create({
          data: {
            groupId,
            subsidiaryId,
            repaymentId: repayment.id,
            orderId: order.id,
            amount: applied,
          },
        });

        allocations.push({ order_id: order.id, amount: applied });
      }

      const appliedTotal = body.amount - remaining;
      const newUsedAmount = Math.max(0, Number(account.usedAmount) - appliedTotal);
      await tx.creditAccount.update({
        where: { id: account.id },
        data: { usedAmount: newUsedAmount },
      });

      const updatedRepayment = await tx.repayment.update({
        where: { id: repayment.id },
        data: { unappliedAmount: remaining },
      });

      return {
        id: updatedRepayment.id,
        credit_account_id: updatedRepayment.creditAccountId,
        amount: Number(updatedRepayment.amount),
        paid_at: updatedRepayment.paidAt.toISOString(),
        method: updatedRepayment.method ?? undefined,
        unapplied_amount: Number(updatedRepayment.unappliedAmount),
        allocations,
      };
    });
  }

  private buildMeta(query: ListQueryDto, total: number) {
    return {
      limit: query.limit ?? 50,
      offset: query.offset ?? 0,
      total,
    };
  }
}
