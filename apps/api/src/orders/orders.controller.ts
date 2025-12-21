import { Body, Controller, Get, Headers, Param, ParseUUIDPipe, Post, Query, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { Permissions } from "../auth/permissions.decorator";
import { PermissionsGuard } from "../auth/permissions.guard";
import { ListQueryDto } from "../common/dto/list-query.dto";
import { CreateOrderDto } from "./dto/create-order.dto";
import { OrdersService } from "./orders.service";

@Controller("v1")
@UseGuards(PermissionsGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

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
  createOrder(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Headers("x-location-id") locationId: string | undefined,
    @Headers("x-channel") channel: string | undefined,
    @Body() body: CreateOrderDto,
  ) {
    return this.ordersService.createOrder(groupId, subsidiaryId, locationId, channel, body);
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
  cancelOrder(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Param("order_id", new ParseUUIDPipe()) orderId: string,
  ) {
    return this.ordersService.cancelOrder(groupId, subsidiaryId, orderId);
  }

  @Permissions("orders.fulfill")
  @Post("orders/:order_id/fulfill")
  fulfillOrder(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Param("order_id", new ParseUUIDPipe()) orderId: string,
  ) {
    return this.ordersService.fulfillOrder(groupId, subsidiaryId, orderId);
  }
}
