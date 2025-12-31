import { Body, Controller, Get, Headers, Param, Post, Query, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { Permissions } from "../auth/permissions.decorator";
import { PermissionsGuard } from "../auth/permissions.guard";
import { ListQueryDto } from "../common/dto/list-query.dto";
import { ProcurementService } from "./procurement.service";
import { AddImportCostsDto } from "./dto/add-import-costs.dto";
import { CreateImportShipmentDto } from "./dto/create-import-shipment.dto";
import { CreatePurchaseRequestDto } from "./dto/create-purchase-request.dto";
import { CreatePurchaseOrderDto } from "./dto/create-purchase-order.dto";
import { ReceiveImportShipmentDto } from "./dto/receive-import-shipment.dto";

@Controller("v1")
@UseGuards(PermissionsGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
export class ProcurementController {
  constructor(private readonly procurementService: ProcurementService) {}

  @Permissions("procurement.request.manage")
  @Get("procurement/purchase-requests")
  listPurchaseRequests(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Query() query: ListQueryDto,
  ) {
    return this.procurementService.listPurchaseRequests(groupId, subsidiaryId, query);
  }

  @Permissions("procurement.request.manage")
  @Post("procurement/purchase-requests")
  createPurchaseRequest(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Body() body: CreatePurchaseRequestDto,
  ) {
    return this.procurementService.createPurchaseRequest(groupId, subsidiaryId, body);
  }

  @Permissions("procurement.order.manage")
  @Get("procurement/purchase-orders")
  listPurchaseOrders(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Query() query: ListQueryDto,
  ) {
    return this.procurementService.listPurchaseOrders(groupId, subsidiaryId, query);
  }

  @Permissions("procurement.order.manage")
  @Post("procurement/purchase-orders")
  createPurchaseOrder(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Body() body: CreatePurchaseOrderDto,
  ) {
    return this.procurementService.createPurchaseOrder(groupId, subsidiaryId, body);
  }

  @Permissions("procurement.imports.manage")
  @Get("procurement/import-shipments")
  listImportShipments(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Query() query: ListQueryDto,
  ) {
    return this.procurementService.listImportShipments(groupId, subsidiaryId, query);
  }

  @Permissions("procurement.imports.manage")
  @Post("procurement/import-shipments")
  createImportShipment(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Body() body: CreateImportShipmentDto,
  ) {
    return this.procurementService.createImportShipment(groupId, subsidiaryId, body);
  }

  @Permissions("procurement.imports.manage")
  @Post("procurement/import-shipments/:id/costs")
  addImportCosts(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Param("id") id: string,
    @Body() body: AddImportCostsDto,
  ) {
    return this.procurementService.addImportCosts(groupId, subsidiaryId, id, body);
  }

  @Permissions("procurement.imports.manage")
  @Post("procurement/import-shipments/:id/finalize")
  finalizeImportShipment(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Param("id") id: string,
  ) {
    return this.procurementService.finalizeImportShipment(groupId, subsidiaryId, id);
  }

  @Permissions("procurement.imports.manage")
  @Post("procurement/import-shipments/:id/receive")
  receiveImportShipment(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Param("id") id: string,
    @Body() body: ReceiveImportShipmentDto,
  ) {
    return this.procurementService.receiveImportShipment(groupId, subsidiaryId, id, body);
  }
}
