import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ListQueryDto } from "../common/dto/list-query.dto";
import { CreateOrderDto } from "./dto/create-order.dto";

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async listOrders(groupId: string, subsidiaryId: string, query: ListQueryDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const createdAt: { gte?: Date; lte?: Date } = {};
    if (query.start_date) {
      createdAt.gte = new Date(query.start_date);
    }
    if (query.end_date) {
      createdAt.lte = new Date(query.end_date);
    }

    const where = {
      groupId,
      subsidiaryId,
      ...(query.status ? { status: query.status } : {}),
      ...(createdAt.gte || createdAt.lte ? { createdAt } : {}),
    };

    const [total, orders] = await this.prisma.$transaction([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: query.offset ?? 0,
        take: query.limit ?? 50,
        include: { items: true },
      }),
    ]);

    return {
      data: orders.map(this.mapOrder),
      meta: this.buildMeta(query, total),
    };
  }

  async createOrder(
    groupId: string,
    subsidiaryId: string,
    locationId: string | undefined,
    channel: string | undefined,
    body: CreateOrderDto,
  ) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");
    if (!body.items?.length) throw new BadRequestException("Order items are required");

    const currency = body.currency ?? "NGN";
    const orderNo = `ORD-${Date.now()}`;

    const items = body.items.map((item) => {
      const unitPrice = item.unit_price ?? 0;
      const totalPrice = unitPrice * item.quantity;
      return {
        productId: item.product_id,
        variantId: item.variant_id,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
      };
    });

    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

    const order = await this.prisma.order.create({
      data: {
        groupId,
        subsidiaryId,
        locationId: locationId ?? undefined,
        channel: channel ?? undefined,
        orderNo,
        customerId: body.customer_id,
        resellerId: body.reseller_id,
        status: "pending",
        totalAmount,
        currency,
        items: { create: items },
      },
      include: { items: true },
    });

    return this.mapOrder(order);
  }

  async getOrder(groupId: string, subsidiaryId: string, orderId: string) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, groupId, subsidiaryId },
      include: { items: true },
    });

    if (!order) throw new NotFoundException("Order not found");

    return this.mapOrder(order);
  }

  async cancelOrder(groupId: string, subsidiaryId: string, orderId: string) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const existing = await this.prisma.order.findFirst({
      where: { id: orderId, groupId, subsidiaryId },
    });
    if (!existing) throw new NotFoundException("Order not found");

    const order = await this.prisma.order.update({
      where: { id: existing.id },
      data: { status: "cancelled" },
      include: { items: true },
    });

    return this.mapOrder(order);
  }

  async fulfillOrder(groupId: string, subsidiaryId: string, orderId: string) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const existing = await this.prisma.order.findFirst({
      where: { id: orderId, groupId, subsidiaryId },
    });
    if (!existing) throw new NotFoundException("Order not found");

    const order = await this.prisma.order.update({
      where: { id: existing.id },
      data: { status: "fulfilled" },
      include: { items: true },
    });

    return this.mapOrder(order);
  }

  private mapOrder(order: {
    id: string;
    orderNo: string;
    status: string;
    customerId: string | null;
    resellerId: string | null;
    totalAmount: any;
    currency: string;
    items: Array<{
      productId: string;
      variantId: string | null;
      quantity: number;
      unitPrice: any;
      totalPrice: any;
    }>;
  }) {
    return {
      id: order.id,
      order_no: order.orderNo,
      status: order.status,
      customer_id: order.customerId ?? undefined,
      reseller_id: order.resellerId ?? undefined,
      total_amount: Number(order.totalAmount),
      currency: order.currency,
      items: order.items.map((item) => ({
        product_id: item.productId,
        variant_id: item.variantId ?? undefined,
        quantity: item.quantity,
        unit_price: Number(item.unitPrice),
        total_price: Number(item.totalPrice),
      })),
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
