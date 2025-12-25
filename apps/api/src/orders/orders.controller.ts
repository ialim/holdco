import { Body, Controller, Get, Headers, Param, ParseUUIDPipe, Post, Query, Req, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { Request } from "express";
import { Permissions } from "../auth/permissions.decorator";
import { PermissionsGuard } from "../auth/permissions.guard";
import { ListQueryDto } from "../common/dto/list-query.dto";
import { AuditService } from "../audit/audit.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { OrdersService } from "./orders.service";

@Controller("v1")
@UseGuards(PermissionsGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly auditService: AuditService,
  ) {}

  @Permissions("orders.read")
  @Get("orders")
  listOrders(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Query() query: ListQueryDto,
  ) {
    return this.ordersService.listOrders(groupId, subsidiaryId, query);
  }

  @Permissions("orders.write")
  @Post("orders")
  async createOrder(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Headers("x-location-id") locationId: string | undefined,
    @Headers("x-channel") channel: string | undefined,
    @Body() body: CreateOrderDto,
    @Req() req: Request,
  ) {
    const order = await this.ordersService.createOrder(groupId, subsidiaryId, locationId, channel, body);
    const actorId = ((req as any).user?.sub ?? (req as any).user?.id ?? (req as any).user?.userId) as string | undefined;
    await this.auditService.record({
      groupId,
      subsidiaryId,
      actorId,
      action: "order.create",
      entityType: "order",
      entityId: order.id,
      payload: {
        order_no: order.order_no,
        total_amount: order.total_amount,
        currency: order.currency,
        channel,
        location_id: locationId,
      },
    });
    return order;
  }

  @Permissions("orders.read")
  @Get("orders/:order_id")
  getOrder(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Param("order_id", new ParseUUIDPipe()) orderId: string,
  ) {
    return this.ordersService.getOrder(groupId, subsidiaryId, orderId);
  }

  @Permissions("orders.cancel")
  @Post("orders/:order_id/cancel")
  async cancelOrder(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Param("order_id", new ParseUUIDPipe()) orderId: string,
    @Req() req: Request,
  ) {
    const order = await this.ordersService.cancelOrder(groupId, subsidiaryId, orderId);
    const actorId = ((req as any).user?.sub ?? (req as any).user?.id ?? (req as any).user?.userId) as string | undefined;
    await this.auditService.record({
      groupId,
      subsidiaryId,
      actorId,
      action: "order.cancel",
      entityType: "order",
      entityId: order.id,
      payload: { status: order.status },
    });
    return order;
  }

  @Permissions("orders.fulfill")
  @Post("orders/:order_id/fulfill")
  async fulfillOrder(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Param("order_id", new ParseUUIDPipe()) orderId: string,
    @Req() req: Request,
  ) {
    const order = await this.ordersService.fulfillOrder(groupId, subsidiaryId, orderId);
    const actorId = ((req as any).user?.sub ?? (req as any).user?.id ?? (req as any).user?.userId) as string | undefined;
    await this.auditService.record({
      groupId,
      subsidiaryId,
      actorId,
      action: "order.fulfill",
      entityType: "order",
      entityId: order.id,
      payload: { status: order.status },
    });
    return order;
  }
}
