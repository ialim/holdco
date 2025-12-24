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
import { CreateShipmentDto } from "./dto/create-shipment.dto";
import { LogisticsService } from "./logistics.service";

@Controller("v1")
@UseGuards(PermissionsGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
export class LogisticsController {
  constructor(
    private readonly logisticsService: LogisticsService,
    private readonly auditService: AuditService,
  ) {}

  @Permissions("logistics.shipment.read")
  @Get("shipments")
  listShipments(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Query() query: ListQueryDto,
  ) {
    return this.logisticsService.listShipments(groupId, subsidiaryId, query);
  }

  @Permissions("logistics.shipment.write")
  @Post("shipments")
  async createShipment(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Body() body: CreateShipmentDto,
    @Req() req: Request,
  ) {
    const shipment = await this.logisticsService.createShipment(groupId, subsidiaryId, body);
    const actorId = ((req as any).user?.sub ?? (req as any).user?.id ?? (req as any).user?.userId) as string | undefined;
    await this.auditService.record({
      groupId,
      subsidiaryId,
      actorId,
      action: "shipment.create",
      entityType: "shipment",
      entityId: shipment.id,
      payload: {
        order_id: shipment.order_id,
        carrier: shipment.carrier,
        tracking_no: shipment.tracking_no,
      },
    });
    return shipment;
  }

  @Permissions("logistics.shipment.read")
  @Get("shipments/:shipment_id")
  getShipment(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Param("shipment_id", new ParseUUIDPipe()) shipmentId: string,
  ) {
    return this.logisticsService.getShipment(groupId, subsidiaryId, shipmentId);
  }
}
