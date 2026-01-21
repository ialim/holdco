import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { Request } from "express";
import { Permissions } from "../auth/permissions.decorator";
import { PermissionsGuard } from "../auth/permissions.guard";
import { ListQueryDto } from "../common/dto/list-query.dto";
import { AuditService } from "../audit/audit.service";
import { InventoryService } from "./inventory.service";
import { StockAdjustmentDto } from "./dto/stock-adjustment.dto";
import { ListStockReservationsDto } from "./dto/list-stock-reservations.dto";
import { ListStockTransfersDto } from "./dto/list-stock-transfers.dto";
import { ReleaseReservationsDto } from "./dto/release-reservations.dto";
import { StockReservationDto } from "./dto/stock-reservation.dto";
import { StockTransferDto } from "./dto/stock-transfer.dto";

@Controller("v1")
@UseGuards(PermissionsGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly auditService: AuditService,
  ) {}

  @Permissions("inventory.stock.read")
  @Get("stock-levels")
  listStockLevels(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Headers("x-location-id") locationId: string | undefined,
    @Query() query: ListQueryDto,
  ) {
    return this.inventoryService.listStockLevels(groupId, subsidiaryId, locationId, query);
  }

  @Permissions("inventory.stock.read")
  @Get("stock-adjustments")
  listStockAdjustments(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Query() query: ListQueryDto,
  ) {
    return this.inventoryService.listStockAdjustments(groupId, subsidiaryId, query);
  }

  @Permissions("inventory.stock.adjust")
  @Post("stock-adjustments")
  async createStockAdjustment(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Body() body: StockAdjustmentDto,
    @Req() req: Request,
  ) {
    const createdById = (req as any).user?.sub as string | undefined;
    const adjustment = await this.inventoryService.createStockAdjustment(groupId, subsidiaryId, body, createdById);
    const actorId = ((req as any).user?.sub ?? (req as any).user?.id ?? (req as any).user?.userId) as string | undefined;
    await this.auditService.record({
      groupId,
      subsidiaryId,
      actorId,
      action: "inventory.adjustment.create",
      entityType: "stock_adjustment",
      entityId: adjustment.id,
      payload: {
        product_id: adjustment.product_id,
        variant_id: adjustment.variant_id,
        location_id: adjustment.location_id,
        quantity: adjustment.quantity,
        reason: adjustment.reason,
      },
    });
    return adjustment;
  }

  @Permissions("inventory.stock.transfer")
  @Post("transfers")
  async createStockTransfer(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Body() body: StockTransferDto,
    @Req() req: Request,
  ) {
    const transfer = await this.inventoryService.createStockTransfer(groupId, subsidiaryId, body);
    const actorId = ((req as any).user?.sub ?? (req as any).user?.id ?? (req as any).user?.userId) as string | undefined;
    await this.auditService.record({
      groupId,
      subsidiaryId,
      actorId,
      action: "inventory.transfer.create",
      entityType: "stock_transfer",
      entityId: transfer.id,
      payload: {
        product_id: transfer.product_id,
        variant_id: transfer.variant_id,
        from_location_id: transfer.from_location_id,
        to_location_id: transfer.to_location_id,
        quantity: transfer.quantity,
        status: transfer.status,
      },
    });
    return transfer;
  }

  @Permissions("inventory.stock.transfer")
  @Post("transfers/:transfer_id/approve")
  async approveStockTransfer(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Param("transfer_id", new ParseUUIDPipe()) transferId: string,
    @Req() req: Request,
  ) {
    const transfer = await this.inventoryService.approveStockTransfer(groupId, subsidiaryId, transferId);
    const actorId = ((req as any).user?.sub ?? (req as any).user?.id ?? (req as any).user?.userId) as string | undefined;
    await this.auditService.record({
      groupId,
      subsidiaryId,
      actorId,
      action: "inventory.transfer.approve",
      entityType: "stock_transfer",
      entityId: transfer.id,
      payload: {
        product_id: transfer.product_id,
        variant_id: transfer.variant_id,
        from_location_id: transfer.from_location_id,
        to_location_id: transfer.to_location_id,
        quantity: transfer.quantity,
        status: transfer.status,
      },
    });
    return transfer;
  }

  @Permissions("inventory.stock.read")
  @Get("transfers")
  listStockTransfers(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Query() query: ListStockTransfersDto,
  ) {
    return this.inventoryService.listStockTransfers(groupId, subsidiaryId, query);
  }

  @Permissions("inventory.stock.transfer")
  @Post("transfers/:transfer_id/complete")
  async completeStockTransfer(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Param("transfer_id", new ParseUUIDPipe()) transferId: string,
    @Req() req: Request,
  ) {
    const transfer = await this.inventoryService.completeStockTransfer(groupId, subsidiaryId, transferId);
    const actorId = ((req as any).user?.sub ?? (req as any).user?.id ?? (req as any).user?.userId) as string | undefined;
    await this.auditService.record({
      groupId,
      subsidiaryId,
      actorId,
      action: "inventory.transfer.complete",
      entityType: "stock_transfer",
      entityId: transfer.id,
      payload: {
        product_id: transfer.product_id,
        variant_id: transfer.variant_id,
        from_location_id: transfer.from_location_id,
        to_location_id: transfer.to_location_id,
        quantity: transfer.quantity,
        status: transfer.status,
      },
    });
    return transfer;
  }

  @Permissions("inventory.stock.transfer")
  @Post("transfers/:transfer_id/receive")
  async receiveStockTransfer(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Param("transfer_id", new ParseUUIDPipe()) transferId: string,
    @Req() req: Request,
  ) {
    const transfer = await this.inventoryService.completeStockTransfer(groupId, subsidiaryId, transferId);
    const actorId = ((req as any).user?.sub ?? (req as any).user?.id ?? (req as any).user?.userId) as string | undefined;
    await this.auditService.record({
      groupId,
      subsidiaryId,
      actorId,
      action: "inventory.transfer.receive",
      entityType: "stock_transfer",
      entityId: transfer.id,
      payload: {
        product_id: transfer.product_id,
        variant_id: transfer.variant_id,
        from_location_id: transfer.from_location_id,
        to_location_id: transfer.to_location_id,
        quantity: transfer.quantity,
        status: transfer.status,
      },
    });
    return transfer;
  }

  @Permissions("inventory.stock.read")
  @Get("reservations")
  listStockReservations(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Query() query: ListStockReservationsDto,
  ) {
    return this.inventoryService.listStockReservations(groupId, subsidiaryId, query);
  }

  @Permissions("inventory.stock.reserve")
  @Post("reservations")
  async createStockReservation(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Headers("x-location-id") locationId: string | undefined,
    @Body() body: StockReservationDto,
    @Req() req: Request,
  ) {
    const reservation = await this.inventoryService.createStockReservation(groupId, subsidiaryId, locationId, body);
    const actorId = ((req as any).user?.sub ?? (req as any).user?.id ?? (req as any).user?.userId) as string | undefined;
    await this.auditService.record({
      groupId,
      subsidiaryId,
      actorId,
      action: "inventory.reservation.create",
      entityType: "stock_reservation",
      entityId: reservation.id,
      payload: {
        order_id: reservation.order_id,
        product_id: reservation.product_id,
        variant_id: reservation.variant_id,
        location_id: reservation.location_id,
        quantity: reservation.quantity,
        status: reservation.status,
      },
    });
    return reservation;
  }

  @Permissions("inventory.stock.reserve")
  @Post("reservations/:reservation_id/release")
  async releaseStockReservation(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Param("reservation_id", new ParseUUIDPipe()) reservationId: string,
    @Req() req: Request,
  ) {
    const reservation = await this.inventoryService.releaseStockReservation(groupId, subsidiaryId, reservationId);
    const actorId = ((req as any).user?.sub ?? (req as any).user?.id ?? (req as any).user?.userId) as string | undefined;
    await this.auditService.record({
      groupId,
      subsidiaryId,
      actorId,
      action: "inventory.reservation.release",
      entityType: "stock_reservation",
      entityId: reservation.id,
      payload: {
        order_id: reservation.order_id,
        product_id: reservation.product_id,
        variant_id: reservation.variant_id,
        location_id: reservation.location_id,
        quantity: reservation.quantity,
        status: reservation.status,
      },
    });
    return reservation;
  }

  @Permissions("inventory.stock.reserve")
  @Post("reservations/release")
  async releaseStockReservationsForOrder(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Body() body: ReleaseReservationsDto,
    @Req() req: Request,
  ) {
    const result = await this.inventoryService.releaseStockReservationsForOrder(groupId, subsidiaryId, body.order_id);
    const actorId = ((req as any).user?.sub ?? (req as any).user?.id ?? (req as any).user?.userId) as string | undefined;
    await this.auditService.record({
      groupId,
      subsidiaryId,
      actorId,
      action: "inventory.reservation.release_order",
      entityType: "stock_reservation",
      entityId: body.order_id,
      payload: {
        order_id: body.order_id,
        released: result.released,
        reservation_ids: result.reservation_ids,
      },
    });
    return result;
  }
}
