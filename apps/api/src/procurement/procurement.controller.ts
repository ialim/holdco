import { Body, Controller, Get, Headers, Post, Query, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { Permissions } from "../auth/permissions.decorator";
import { PermissionsGuard } from "../auth/permissions.guard";
import { ListQueryDto } from "../common/dto/list-query.dto";
import { ProcurementService } from "./procurement.service";
import { CreatePurchaseRequestDto } from "./dto/create-purchase-request.dto";
import { CreatePurchaseOrderDto } from "./dto/create-purchase-order.dto";

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
}
