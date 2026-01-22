import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { InventoryService } from "../inventory/inventory.service";
import { ListQueryDto } from "../common/dto/list-query.dto";
import { CreateOrderDto } from "./dto/create-order.dto";

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly inventoryService: InventoryService,
  ) {}

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
      ...(query.channel ? { channel: query.channel } : {}),
      ...(query.location_id ? { locationId: query.location_id } : {}),
      ...(query.reseller_id ? { resellerId: query.reseller_id } : {}),
      ...(createdAt.gte || createdAt.lte ? { createdAt } : {}),
    };

    const [total, orders] = await this.prisma.$transaction([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: query.offset ?? 0,
        take: query.limit ?? 50,
        include: { items: { include: { product: true, variant: true } }, reseller: true },
      }),
    ]);

    return {
      data: orders.map((order) => this.mapOrder(order)),
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

    const itemsTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const discountAmount = body.discount_amount ?? 0;
    const taxAmount = body.tax_amount ?? 0;
    const shippingAmount = body.shipping_amount ?? 0;
    const totalAmount = itemsTotal - discountAmount + taxAmount + shippingAmount;

    if (totalAmount < 0) {
      throw new BadRequestException("Order total cannot be negative");
    }

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
        discountAmount,
        taxAmount,
        shippingAmount,
        paidAmount: 0,
        paymentStatus: "unpaid",
        currency,
        items: { create: items },
      },
      include: { items: { include: { product: true, variant: true } } },
    });

    return this.mapOrder(order);
  }

  async getOrder(groupId: string, subsidiaryId: string, orderId: string) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const order = await this.prisma.order.findFirst({
      where: { id: orderId, groupId, subsidiaryId },
      include: { items: { include: { product: true, variant: true } }, reseller: true },
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

    await this.inventoryService.releaseStockReservationsForOrder(groupId, subsidiaryId, orderId);

    const order = await this.prisma.order.update({
      where: { id: existing.id },
      data: { status: "cancelled" },
      include: { items: { include: { product: true, variant: true } } },
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
      include: { items: { include: { product: true, variant: true } } },
    });

    return this.mapOrder(order);
  }

  async recordOrderPayment(params: {
    groupId: string;
    subsidiaryId: string;
    orderId: string;
    amount: number;
    currency: string;
    method: string;
    status: string;
    provider?: string;
    reference?: string;
    paymentIntentId?: string;
    paymentType?: string;
    pointsRedeemed?: number;
  }) {
    const order = await this.prisma.order.findFirst({
      where: { id: params.orderId, groupId: params.groupId, subsidiaryId: params.subsidiaryId },
    });
    if (!order) throw new NotFoundException("Order not found");

    const payment = await this.prisma.orderPayment.create({
      data: {
        groupId: params.groupId,
        subsidiaryId: params.subsidiaryId,
        orderId: params.orderId,
        paymentIntentId: params.paymentIntentId,
        method: params.method,
        paymentType: params.paymentType ?? "full",
        amount: params.amount,
        currency: params.currency,
        status: params.status,
        provider: params.provider,
        reference: params.reference,
        pointsRedeemed: params.pointsRedeemed,
      },
    });

    const updated = await this.refreshOrderPaymentSummary(
      params.groupId,
      params.subsidiaryId,
      params.orderId,
    );

    return { payment, order: updated };
  }

  async refreshOrderPaymentSummary(groupId: string, subsidiaryId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, groupId, subsidiaryId },
    });
    if (!order) throw new NotFoundException("Order not found");

    const captured = await this.prisma.orderPayment.aggregate({
      where: { orderId, groupId, subsidiaryId, status: "captured" },
      _sum: { amount: true },
    });
    const paidAmount = Number(captured._sum.amount ?? 0);
    const paymentStatus =
      paidAmount >= Number(order.totalAmount)
        ? "paid"
        : paidAmount > 0
          ? "partial"
          : "unpaid";

    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: { paidAmount, paymentStatus },
      include: { items: { include: { product: true, variant: true } } },
    });

    return this.mapOrder(updated);
  }

  private mapOrder(order: {
    id: string;
    orderNo: string;
    status: string;
    customerId: string | null;
    resellerId: string | null;
    reseller?: { name: string | null } | null;
    totalAmount: any;
    discountAmount?: any;
    taxAmount?: any;
    shippingAmount?: any;
    paidAmount?: any;
    paymentStatus?: string | null;
    currency: string;
    items: Array<{
      productId: string;
      variantId: string | null;
      product?: { name?: string | null; sku?: string | null } | null;
      variant?: { size?: string | null; unit?: string | null; barcode?: string | null } | null;
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
      reseller_name: order.reseller?.name ?? undefined,
      total_amount: Number(order.totalAmount),
      discount_amount: Number(order.discountAmount ?? 0),
      tax_amount: Number(order.taxAmount ?? 0),
      shipping_amount: Number(order.shippingAmount ?? 0),
      paid_amount: Number(order.paidAmount ?? 0),
      payment_status: order.paymentStatus ?? "unpaid",
      balance_due: Math.max(0, Number(order.totalAmount) - Number(order.paidAmount ?? 0)),
      currency: order.currency,
      items: order.items.map((item) => ({
        product_id: item.productId,
        product_name: item.product?.name ?? undefined,
        product_sku: item.product?.sku ?? undefined,
        variant_id: item.variantId ?? undefined,
        variant_label: this.formatVariantLabel(item.variant),
        quantity: item.quantity,
        unit_price: Number(item.unitPrice),
        total_price: Number(item.totalPrice),
      })),
    };
  }

  private formatVariantLabel(
    variant: { size?: string | null; unit?: string | null; barcode?: string | null } | null | undefined,
  ) {
    if (!variant) return undefined;
    const size = variant.size ?? "";
    const unit = variant.unit ? ` ${variant.unit}` : "";
    const barcode = variant.barcode ? ` - ${variant.barcode}` : "";
    const label = `${size}${unit}${barcode}`.trim();
    return label || undefined;
  }

  private buildMeta(query: ListQueryDto, total: number) {
    return {
      limit: query.limit ?? 50,
      offset: query.offset ?? 0,
      total,
    };
  }
}
