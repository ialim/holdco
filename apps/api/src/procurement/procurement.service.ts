import { BadRequestException, Injectable } from "@nestjs/common";
import { ListQueryDto } from "../common/dto/list-query.dto";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePurchaseRequestDto } from "./dto/create-purchase-request.dto";
import { CreatePurchaseOrderDto } from "./dto/create-purchase-order.dto";

@Injectable()
export class ProcurementService {
  constructor(private readonly prisma: PrismaService) {}

  async listPurchaseRequests(
    groupId: string,
    subsidiaryId: string,
    query: ListQueryDto
  ) {
    if (!groupId)
      throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId)
      throw new BadRequestException("X-Subsidiary-Id header is required");

    const where = {
      groupId,
      subsidiaryId,
      ...(query.status ? { status: query.status } : {}),
    };

    const [total, requests] = await this.prisma.$transaction([
      this.prisma.purchaseRequest.count({ where }),
      this.prisma.purchaseRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: query.offset ?? 0,
        take: query.limit ?? 50,
        include: { items: true },
      }),
    ]);

    return {
      data: requests.map((request: any) => ({
        id: request.id,
        requester_id: request.requesterId ?? undefined,
        status: request.status,
        needed_by: this.formatDate(request.neededBy),
        notes: request.notes ?? undefined,
        items: request.items.map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          unit: item.unit ?? undefined,
          estimated_unit_cost:
            item.estimatedUnitCost !== null
              ? Number(item.estimatedUnitCost)
              : undefined,
        })),
      })),
      meta: this.buildMeta(query, total),
    };
  }

  async createPurchaseRequest(
    groupId: string,
    subsidiaryId: string,
    body: CreatePurchaseRequestDto
  ) {
    if (!groupId)
      throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId)
      throw new BadRequestException("X-Subsidiary-Id header is required");

    const request = await this.prisma.purchaseRequest.create({
      data: {
        groupId,
        subsidiaryId,
        requesterId: body.requester_id,
        neededBy: body.needed_by ? new Date(body.needed_by) : undefined,
        notes: body.notes,
        items: {
          create: body.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            estimatedUnitCost: item.estimated_unit_cost,
          })),
        },
      },
      include: { items: true },
    });

    return {
      id: request.id,
      requester_id: request.requesterId ?? undefined,
      status: request.status,
      needed_by: this.formatDate(request.neededBy),
      notes: request.notes ?? undefined,
      items: request.items.map((item: any) => ({
        description: item.description,
        quantity: item.quantity,
        unit: item.unit ?? undefined,
        estimated_unit_cost:
          item.estimatedUnitCost !== null
            ? Number(item.estimatedUnitCost)
            : undefined,
      })),
    };
  }

  async listPurchaseOrders(
    groupId: string,
    subsidiaryId: string,
    query: ListQueryDto
  ) {
    if (!groupId)
      throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId)
      throw new BadRequestException("X-Subsidiary-Id header is required");

    const where = {
      groupId,
      subsidiaryId,
      ...(query.status ? { status: query.status } : {}),
    };

    const [total, orders] = await this.prisma.$transaction([
      this.prisma.purchaseOrder.count({ where }),
      this.prisma.purchaseOrder.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: query.offset ?? 0,
        take: query.limit ?? 50,
        include: { items: true },
      }),
    ]);

    return {
      data: orders.map((order: any) => ({
        id: order.id,
        vendor_id: order.vendorId ?? undefined,
        status: order.status,
        ordered_at: order.orderedAt ? order.orderedAt.toISOString() : undefined,
        expected_at: this.formatDate(order.expectedAt),
        total_amount:
          order.totalAmount !== null ? Number(order.totalAmount) : undefined,
        currency: order.currency ?? undefined,
        items: order.items.map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: Number(item.unitPrice),
          total_price: Number(item.totalPrice),
        })),
      })),
      meta: this.buildMeta(query, total),
    };
  }

  async createPurchaseOrder(
    groupId: string,
    subsidiaryId: string,
    body: CreatePurchaseOrderDto
  ) {
    if (!groupId)
      throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId)
      throw new BadRequestException("X-Subsidiary-Id header is required");

    const items = body.items.map((item) => {
      const totalPrice = item.total_price ?? item.unit_price * item.quantity;
      return {
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        totalPrice,
      };
    });

    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

    const order = await this.prisma.purchaseOrder.create({
      data: {
        groupId,
        subsidiaryId,
        vendorId: body.vendor_id,
        orderedAt: body.ordered_at ? new Date(body.ordered_at) : undefined,
        expectedAt: body.expected_at ? new Date(body.expected_at) : undefined,
        totalAmount,
        currency: body.currency ?? "NGN",
        items: {
          create: items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
        },
      },
      include: { items: true },
    });

    return {
      id: order.id,
      vendor_id: order.vendorId ?? undefined,
      status: order.status,
      ordered_at: order.orderedAt ? order.orderedAt.toISOString() : undefined,
      expected_at: this.formatDate(order.expectedAt),
      total_amount:
        order.totalAmount !== null ? Number(order.totalAmount) : undefined,
      currency: order.currency ?? undefined,
      items: order.items.map((item: any) => ({
        description: item.description,
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

  private formatDate(value: Date | null) {
    return value ? value.toISOString().slice(0, 10) : undefined;
  }
}
