import { BadRequestException, Injectable } from "@nestjs/common";
import { ListQueryDto } from "../common/dto/list-query.dto";
import { PrismaService } from "../prisma/prisma.service";
import { StockAdjustmentDto } from "./dto/stock-adjustment.dto";
import { StockReservationDto } from "./dto/stock-reservation.dto";
import { StockTransferDto } from "./dto/stock-transfer.dto";

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async listStockLevels(groupId: string, subsidiaryId: string, locationId: string | undefined, query: ListQueryDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const where = {
      groupId,
      subsidiaryId,
      ...(locationId ? { locationId } : {}),
    };

    const [total, levels] = await this.prisma.$transaction([
      this.prisma.stockLevel.count({ where }),
      this.prisma.stockLevel.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: query.offset ?? 0,
        take: query.limit ?? 50,
      }),
    ]);

    return {
      data: levels.map((level: any) => ({
        id: level.id,
        product_id: level.productId,
        variant_id: level.variantId ?? undefined,
        location_id: level.locationId,
        on_hand: level.onHand,
        reserved: level.reserved,
        available: level.onHand - level.reserved,
      })),
      meta: this.buildMeta(query, total),
    };
  }

  async createStockAdjustment(
    groupId: string,
    subsidiaryId: string,
    body: StockAdjustmentDto,
    createdById?: string,
  ) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const variantKey = body.variant_id ?? null;

    const adjustment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.stockAdjustment.create({
        data: {
          groupId,
          subsidiaryId,
          locationId: body.location_id,
          productId: body.product_id,
          variantId: body.variant_id,
          quantity: body.quantity,
          reason: body.reason,
          createdById,
        },
      });

      const existingLevel = await tx.stockLevel.findFirst({
        where: {
          groupId,
          subsidiaryId,
          locationId: body.location_id,
          productId: body.product_id,
          variantId: variantKey,
        },
      });

      if (existingLevel) {
        await tx.stockLevel.update({
          where: { id: existingLevel.id },
          data: { onHand: { increment: body.quantity } },
        });
      } else {
        await tx.stockLevel.create({
          data: {
            groupId,
            subsidiaryId,
            locationId: body.location_id,
            productId: body.product_id,
            variantId: body.variant_id,
            onHand: body.quantity,
            reserved: 0,
          },
        });
      }

      return created;
    });

    return {
      id: adjustment.id,
      product_id: adjustment.productId,
      variant_id: adjustment.variantId ?? undefined,
      location_id: adjustment.locationId,
      quantity: adjustment.quantity,
      reason: adjustment.reason,
      created_at: adjustment.createdAt.toISOString(),
    };
  }

  async createStockTransfer(groupId: string, subsidiaryId: string, body: StockTransferDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const transfer = await this.prisma.stockTransfer.create({
      data: {
        groupId,
        subsidiaryId,
        fromLocationId: body.from_location_id,
        toLocationId: body.to_location_id,
        productId: body.product_id,
        variantId: body.variant_id,
        quantity: body.quantity,
      },
    });

    return {
      id: transfer.id,
      product_id: transfer.productId,
      variant_id: transfer.variantId ?? undefined,
      from_location_id: transfer.fromLocationId,
      to_location_id: transfer.toLocationId,
      quantity: transfer.quantity,
      status: transfer.status,
      created_at: transfer.createdAt.toISOString(),
    };
  }

  async createStockReservation(
    groupId: string,
    subsidiaryId: string,
    locationId: string | undefined,
    body: StockReservationDto,
  ) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");
    if (!locationId) throw new BadRequestException("X-Location-Id header is required");

    const variantKey = body.variant_id ?? null;

    const reservation = await this.prisma.$transaction(async (tx) => {
      const created = await tx.stockReservation.create({
        data: {
          groupId,
          subsidiaryId,
          locationId,
          orderId: body.order_id,
          productId: body.product_id,
          variantId: body.variant_id,
          quantity: body.quantity,
        },
      });

      const existingLevel = await tx.stockLevel.findFirst({
        where: {
          groupId,
          subsidiaryId,
          locationId,
          productId: body.product_id,
          variantId: variantKey,
        },
      });

      if (existingLevel) {
        await tx.stockLevel.update({
          where: { id: existingLevel.id },
          data: { reserved: { increment: body.quantity } },
        });
      } else {
        await tx.stockLevel.create({
          data: {
            groupId,
            subsidiaryId,
            locationId,
            productId: body.product_id,
            variantId: body.variant_id,
            onHand: 0,
            reserved: body.quantity,
          },
        });
      }

      return created;
    });

    return {
      id: reservation.id,
      order_id: reservation.orderId,
      product_id: reservation.productId,
      variant_id: reservation.variantId ?? undefined,
      location_id: reservation.locationId,
      quantity: reservation.quantity,
      status: reservation.status,
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
