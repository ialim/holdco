import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { ListQueryDto } from "../common/dto/list-query.dto";
import { PrismaService } from "../prisma/prisma.service";
import { StockAdjustmentDto } from "./dto/stock-adjustment.dto";
import { ListStockTransfersDto } from "./dto/list-stock-transfers.dto";
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
      ...(query.product_id ? { productId: query.product_id } : {}),
      ...(query.variant_id ? { variantId: query.variant_id } : {}),
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

    const adjustment = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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

  async listStockTransfers(groupId: string, subsidiaryId: string, query: ListStockTransfersDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const where: Prisma.StockTransferWhereInput = {
      groupId,
      subsidiaryId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.product_id ? { productId: query.product_id } : {}),
      ...(query.variant_id ? { variantId: query.variant_id } : {}),
      ...(query.from_location_id ? { fromLocationId: query.from_location_id } : {}),
      ...(query.to_location_id ? { toLocationId: query.to_location_id } : {}),
    };

    const [total, transfers] = await this.prisma.$transaction([
      this.prisma.stockTransfer.count({ where }),
      this.prisma.stockTransfer.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: query.offset ?? 0,
        take: query.limit ?? 50,
        include: {
          product: true,
          variant: true,
          fromLocation: true,
          toLocation: true,
        },
      }),
    ]);

    return {
      data: transfers.map((transfer: any) => ({
        id: transfer.id,
        product_id: transfer.productId,
        product_name: transfer.product?.name,
        product_sku: transfer.product?.sku,
        variant_id: transfer.variantId ?? undefined,
        variant_label: transfer.variant
          ? `${transfer.variant.size ?? ""}${transfer.variant.unit ? ` ${transfer.variant.unit}` : ""}${
              transfer.variant.barcode ? ` - ${transfer.variant.barcode}` : ""
            }`.trim()
          : undefined,
        from_location_id: transfer.fromLocationId,
        from_location_name: transfer.fromLocation?.name,
        to_location_id: transfer.toLocationId,
        to_location_name: transfer.toLocation?.name,
        quantity: transfer.quantity,
        status: transfer.status,
        created_at: transfer.createdAt.toISOString(),
        updated_at: transfer.updatedAt.toISOString(),
      })),
      meta: this.buildMeta(query, total),
    };
  }

  async completeStockTransfer(groupId: string, subsidiaryId: string, transferId: string) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const transfer = await this.prisma.stockTransfer.findFirst({
      where: { id: transferId, groupId, subsidiaryId },
      include: { fromLocation: true, toLocation: true, product: true, variant: true },
    });
    if (!transfer) {
      throw new NotFoundException("Transfer not found");
    }
    if (transfer.status === "completed") {
      return {
        id: transfer.id,
        product_id: transfer.productId,
        variant_id: transfer.variantId ?? undefined,
        from_location_id: transfer.fromLocationId,
        to_location_id: transfer.toLocationId,
        quantity: transfer.quantity,
        status: transfer.status,
        created_at: transfer.createdAt.toISOString(),
        updated_at: transfer.updatedAt.toISOString(),
      };
    }

    const result = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const fromLevel = await tx.stockLevel.findFirst({
        where: {
          groupId,
          subsidiaryId,
          locationId: transfer.fromLocationId,
          productId: transfer.productId,
          variantId: transfer.variantId ?? null,
        },
      });
      if (!fromLevel) {
        throw new BadRequestException("Source stock level not found");
      }
      const available = fromLevel.onHand - fromLevel.reserved;
      if (available < transfer.quantity) {
        throw new BadRequestException("Insufficient available stock to complete transfer");
      }

      await tx.stockLevel.update({
        where: { id: fromLevel.id },
        data: { onHand: { decrement: transfer.quantity } },
      });

      const toLevel = await tx.stockLevel.findFirst({
        where: {
          groupId,
          subsidiaryId,
          locationId: transfer.toLocationId,
          productId: transfer.productId,
          variantId: transfer.variantId ?? null,
        },
      });

      if (toLevel) {
        await tx.stockLevel.update({
          where: { id: toLevel.id },
          data: { onHand: { increment: transfer.quantity } },
        });
      } else {
        await tx.stockLevel.create({
          data: {
            groupId,
            subsidiaryId,
            locationId: transfer.toLocationId,
            productId: transfer.productId,
            variantId: transfer.variantId,
            onHand: transfer.quantity,
            reserved: 0,
          },
        });
      }

      return tx.stockTransfer.update({
        where: { id: transfer.id },
        data: { status: "completed" },
      });
    });

    return {
      id: result.id,
      product_id: result.productId,
      variant_id: result.variantId ?? undefined,
      from_location_id: result.fromLocationId,
      to_location_id: result.toLocationId,
      quantity: result.quantity,
      status: result.status,
      created_at: result.createdAt.toISOString(),
      updated_at: result.updatedAt.toISOString(),
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

    const reservation = await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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

  async releaseStockReservations(groupId: string, subsidiaryId: string, reservationIds: string[]) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");
    if (!reservationIds.length) return;

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const reservations = await tx.stockReservation.findMany({
        where: { id: { in: reservationIds }, groupId, subsidiaryId },
      });

      for (const reservation of reservations) {
        if (reservation.status !== "active") continue;

        const variantKey = reservation.variantId ?? null;
        const existingLevel = await tx.stockLevel.findFirst({
          where: {
            groupId,
            subsidiaryId,
            locationId: reservation.locationId,
            productId: reservation.productId,
            variantId: variantKey,
          },
        });

        if (existingLevel) {
          const nextReserved = Math.max(0, existingLevel.reserved - reservation.quantity);
          await tx.stockLevel.update({
            where: { id: existingLevel.id },
            data: { reserved: nextReserved },
          });
        }

        await tx.stockReservation.update({
          where: { id: reservation.id },
          data: { status: "released" },
        });
      }
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
