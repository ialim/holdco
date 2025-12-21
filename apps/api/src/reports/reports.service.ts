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
      select: { resellerId: true, usedAmount: true },
    });

    return {
      data: accounts.map((account: any) => ({
        reseller_id: account.resellerId,
        balance: Number(account.usedAmount),
      })),
    };
  }
}
