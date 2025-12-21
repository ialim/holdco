import {
  Body,
  Controller,
  Get,
  Headers,
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
import { InventoryService } from "./inventory.service";
import { StockAdjustmentDto } from "./dto/stock-adjustment.dto";
import { StockReservationDto } from "./dto/stock-reservation.dto";
import { StockTransferDto } from "./dto/stock-transfer.dto";

@Controller("v1")
@UseGuards(PermissionsGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

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

  @Permissions("inventory.stock.adjust")
  @Post("stock-adjustments")
  createStockAdjustment(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Body() body: StockAdjustmentDto,
    @Req() req: Request,
  ) {
    const createdById = (req as any).user?.sub as string | undefined;
    return this.inventoryService.createStockAdjustment(groupId, subsidiaryId, body, createdById);
  }

  @Permissions("inventory.stock.transfer")
  @Post("transfers")
  createStockTransfer(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Body() body: StockTransferDto,
  ) {
    return this.inventoryService.createStockTransfer(groupId, subsidiaryId, body);
  }

  @Permissions("inventory.stock.reserve")
  @Post("reservations")
  createStockReservation(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Headers("x-location-id") locationId: string | undefined,
    @Body() body: StockReservationDto,
  ) {
    return this.inventoryService.createStockReservation(groupId, subsidiaryId, locationId, body);
  }
}
