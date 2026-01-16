import { BadRequestException, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ReportRangeDto } from "./dto/report-range.dto";

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async salesReport(groupId: string, subsidiaryId: string, query: ReportRangeDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const createdAt: { gte?: Date; lte?: Date } = {};
    if (query.start_date) {
      createdAt.gte = new Date(query.start_date);
    }
    if (query.end_date) {
      const end = new Date(query.end_date);
      end.setHours(23, 59, 59, 999);
      createdAt.lte = end;
    }

    const where = {
      groupId,
      subsidiaryId,
      ...(createdAt.gte || createdAt.lte ? { createdAt } : {}),
    };

    const orders = await this.prisma.order.findMany({
      where,
      select: { createdAt: true, totalAmount: true },
      orderBy: { createdAt: "asc" },
    });

    const buckets = new Map<string, { revenue: number; orders_count: number }>();
    for (const order of orders) {
      const dateKey = order.createdAt.toISOString().slice(0, 10);
      const existing = buckets.get(dateKey) ?? { revenue: 0, orders_count: 0 };
      existing.revenue += Number(order.totalAmount);
      existing.orders_count += 1;
      buckets.set(dateKey, existing);
    }

    const data = Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, metrics]) => ({
        date,
        revenue: metrics.revenue,
        orders_count: metrics.orders_count,
      }));

    return { data };
  }

  async inventoryReport(groupId: string, subsidiaryId: string) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const levels = await this.prisma.stockLevel.findMany({
      where: { groupId, subsidiaryId },
      include: { product: true },
    });

    return {
      data: levels.map((level: any) => ({
        sku: level.product.sku,
        location_id: level.locationId,
        on_hand: level.onHand,
      })),
    };
  }

  async creditReport(groupId: string, subsidiaryId: string) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const accounts = await this.prisma.creditAccount.findMany({
      where: { groupId, subsidiaryId },
      include: { reseller: true },
    });

    const resellerIds = accounts.map((account) => account.resellerId);
    const creditAccountIds = accounts.map((account) => account.id);
    const orders = resellerIds.length
      ? await this.prisma.order.findMany({
          where: {
            groupId,
            subsidiaryId,
            resellerId: { in: resellerIds },
            channel: "wholesale",
            status: { not: "cancelled" },
          },
          orderBy: { createdAt: "asc" },
        })
      : [];

    const repayments = creditAccountIds.length
      ? await this.prisma.repayment.findMany({
          where: { groupId, subsidiaryId, creditAccountId: { in: creditAccountIds } },
          orderBy: { paidAt: "desc" },
          include: { allocations: true },
        })
      : [];

    const ordersByReseller = new Map<string, typeof orders>();
    for (const order of orders) {
      const list = ordersByReseller.get(order.resellerId ?? "") ?? [];
      list.push(order);
      if (order.resellerId) ordersByReseller.set(order.resellerId, list);
    }

    const repaymentsByAccount = new Map<string, typeof repayments>();
    for (const repayment of repayments) {
      const list = repaymentsByAccount.get(repayment.creditAccountId) ?? [];
      list.push(repayment);
      repaymentsByAccount.set(repayment.creditAccountId, list);
    }

    const now = new Date();

    return {
      data: accounts.map((account: any) => {
        const limitAmount = Number(account.limitAmount);
        const usedAmount = Number(account.usedAmount);
        const availableAmount = Math.max(0, limitAmount - usedAmount);
        const accountOrders = ordersByReseller.get(account.resellerId) ?? [];

        const openOrders = accountOrders
          .map((order: any) => {
            const totalAmount = Number(order.totalAmount);
            const paidAmount = Number(order.paidAmount ?? 0);
            const balanceDue = Math.max(0, totalAmount - paidAmount);
            const ageDays = Math.floor(
              (now.getTime() - order.createdAt.getTime()) / (1000 * 60 * 60 * 24),
            );
            return {
              order_id: order.id,
              order_no: order.orderNo,
              status: order.status,
              total_amount: totalAmount,
              paid_amount: paidAmount,
              balance_due: balanceDue,
              currency: order.currency,
              created_at: order.createdAt.toISOString(),
              age_days: ageDays,
            };
          })
          .filter((order: any) => order.balance_due > 0);

        const aging = openOrders.reduce(
          (acc: any, order: any) => {
            const bucket =
              order.age_days <= 30
                ? "0_30"
                : order.age_days <= 60
                  ? "31_60"
                  : order.age_days <= 90
                    ? "61_90"
                    : "90_plus";
            acc[bucket] = (acc[bucket] ?? 0) + order.balance_due;
            return acc;
          },
          { "0_30": 0, "31_60": 0, "61_90": 0, "90_plus": 0 },
        );

        const accountRepayments = repaymentsByAccount.get(account.id) ?? [];
        const repaymentHistory = accountRepayments.map((repayment: any) => ({
          repayment_id: repayment.id,
          amount: Number(repayment.amount),
          unapplied_amount: Number(repayment.unappliedAmount ?? 0),
          paid_at: repayment.paidAt.toISOString(),
          method: repayment.method ?? undefined,
          allocations: repayment.allocations.map((alloc: any) => ({
            order_id: alloc.orderId,
            amount: Number(alloc.amount),
          })),
        }));

        return {
          reseller_id: account.resellerId,
          reseller_name: account.reseller?.name,
          limit_amount: limitAmount,
          used_amount: usedAmount,
          available_amount: availableAmount,
          status: account.status,
          aging,
          open_orders: openOrders,
          repayments: repaymentHistory,
        };
      }),
    };
  }
}
