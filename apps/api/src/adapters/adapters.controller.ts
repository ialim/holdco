import {
  Body,
  Controller,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { Request } from "express";
import { Permissions } from "../auth/permissions.decorator";
import { PermissionsGuard } from "../auth/permissions.guard";
import { CreateOrderDto } from "../orders/dto/create-order.dto";
import { CreateRepaymentDto } from "../credit/dto/create-repayment.dto";
import { AuditService } from "../audit/audit.service";
import { AdaptersService } from "./adapters.service";
import { AdapterCheckoutDto } from "./dto/adapter-checkout.dto";
import { ResellerOnboardDto } from "./dto/reseller-onboard.dto";

@UseGuards(PermissionsGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
@Controller("v1/adapters")
export class AdaptersController {
  constructor(
    private readonly adaptersService: AdaptersService,
    private readonly auditService: AuditService,
  ) {}

  @Permissions("orders.write")
  @Post("wholesale/orders")
  async createWholesaleOrder(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Headers("x-location-id") locationId: string | undefined,
    @Body() body: CreateOrderDto,
    @Req() req: Request,
  ) {
    const order = await this.adaptersService.createWholesaleOrder({ groupId, subsidiaryId, locationId, body });
    const actorId = ((req as any).user?.sub ?? (req as any).user?.id ?? (req as any).user?.userId) as string | undefined;
    await this.auditService.record({
      groupId,
      subsidiaryId,
      actorId,
      action: "adapter.wholesale.order.create",
      entityType: "order",
      entityId: order.id,
      payload: {
        order_no: order.order_no,
        total_amount: order.total_amount,
        currency: order.currency,
        location_id: locationId,
      },
    });
    return order;
  }

  @Permissions("orders.fulfill")
  @Post("wholesale/orders/:order_id/fulfill")
  async fulfillWholesaleOrder(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Param("order_id", new ParseUUIDPipe()) orderId: string,
    @Req() req: Request,
  ) {
    const order = await this.adaptersService.fulfillWholesaleOrder({ groupId, subsidiaryId, orderId });
    const actorId = ((req as any).user?.sub ?? (req as any).user?.id ?? (req as any).user?.userId) as string | undefined;
    await this.auditService.record({
      groupId,
      subsidiaryId,
      actorId,
      action: "adapter.wholesale.order.fulfill",
      entityType: "order",
      entityId: order.id,
      payload: { status: order.status },
    });
    return order;
  }

  @Permissions("orders.write", "payments.intent.create", "payments.capture", "inventory.stock.reserve", "loyalty.points.issue")
  @Post("retail/checkout")
  async retailCheckout(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Headers("x-location-id") locationId: string | undefined,
    @Body() body: AdapterCheckoutDto,
    @Req() req: Request,
  ) {
    const result = await this.adaptersService.retailCheckout({ groupId, subsidiaryId, locationId, body });
    const actorId = ((req as any).user?.sub ?? (req as any).user?.id ?? (req as any).user?.userId) as string | undefined;
    await this.auditService.record({
      groupId,
      subsidiaryId,
      actorId,
      action: "adapter.retail.checkout",
      entityType: "order",
      entityId: result.order?.id,
      payload: {
        order_no: result.order?.order_no,
        total_amount: result.order?.total_amount,
        currency: result.order?.currency,
        payment_intent_id: result.payment_intent?.id,
        reservations_count: Array.isArray(result.reservations) ? result.reservations.length : 0,
        location_id: locationId,
      },
    });
    return result;
  }

  @Permissions("orders.write", "payments.intent.create", "payments.capture")
  @Post("digital/checkout")
  async digitalCheckout(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Headers("x-location-id") locationId: string | undefined,
    @Body() body: AdapterCheckoutDto,
    @Req() req: Request,
  ) {
    const result = await this.adaptersService.digitalCheckout({ groupId, subsidiaryId, locationId, body });
    const actorId = ((req as any).user?.sub ?? (req as any).user?.id ?? (req as any).user?.userId) as string | undefined;
    await this.auditService.record({
      groupId,
      subsidiaryId,
      actorId,
      action: "adapter.digital.checkout",
      entityType: "order",
      entityId: result.order?.id,
      payload: {
        order_no: result.order?.order_no,
        total_amount: result.order?.total_amount,
        currency: result.order?.currency,
        payment_intent_id: result.payment_intent?.id,
        location_id: locationId,
      },
    });
    return result;
  }

  @Permissions("credit.reseller.write", "credit.account.write", "credit.limit.write")
  @Post("credit/onboard")
  async onboardReseller(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Body() body: ResellerOnboardDto,
    @Req() req: Request,
  ) {
    const result = await this.adaptersService.onboardReseller({ groupId, subsidiaryId, body });
    const actorId = ((req as any).user?.sub ?? (req as any).user?.id ?? (req as any).user?.userId) as string | undefined;
    await this.auditService.record({
      groupId,
      subsidiaryId,
      actorId,
      action: "adapter.credit.onboard",
      entityType: "reseller",
      entityId: result.reseller?.id,
      payload: {
        reseller_name: result.reseller?.name,
        credit_account_id: result.credit_account?.id,
        limit_amount: result.credit_account?.limit_amount,
      },
    });
    return result;
  }

  @Permissions("credit.repayment.write")
  @Post("credit/repayments")
  async recordResellerRepayment(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Body() body: CreateRepaymentDto,
    @Req() req: Request,
  ) {
    const repayment = await this.adaptersService.recordResellerRepayment({ groupId, subsidiaryId, body });
    const actorId = ((req as any).user?.sub ?? (req as any).user?.id ?? (req as any).user?.userId) as string | undefined;
    await this.auditService.record({
      groupId,
      subsidiaryId,
      actorId,
      action: "adapter.credit.repayment",
      entityType: "repayment",
      entityId: repayment.id,
      payload: {
        credit_account_id: repayment.credit_account_id,
        amount: repayment.amount,
      },
    });
    return repayment;
  }
}
