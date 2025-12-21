import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { Permissions } from "../auth/permissions.decorator";
import { PermissionsGuard } from "../auth/permissions.guard";
import { ListQueryDto } from "../common/dto/list-query.dto";
import { CreateShipmentDto } from "./dto/create-shipment.dto";
import { LogisticsService } from "./logistics.service";

@Controller("v1")
@UseGuards(PermissionsGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
export class LogisticsController {
  constructor(private readonly logisticsService: LogisticsService) {}

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
  createShipment(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Body() body: CreateShipmentDto,
  ) {
    return this.logisticsService.createShipment(groupId, subsidiaryId, body);
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
