import {
  Body,
  Controller,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { Permissions } from "../auth/permissions.decorator";
import { PermissionsGuard } from "../auth/permissions.guard";
import { CreateOrderDto } from "../orders/dto/create-order.dto";
import { CreateRepaymentDto } from "../credit/dto/create-repayment.dto";
import { AdaptersService } from "./adapters.service";
import { AdapterCheckoutDto } from "./dto/adapter-checkout.dto";
import { ResellerOnboardDto } from "./dto/reseller-onboard.dto";

@UseGuards(PermissionsGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
@Controller("v1/adapters")
export class AdaptersController {
  constructor(private readonly adaptersService: AdaptersService) {}

  @Permissions("orders.write")
  @Post("wholesale/orders")
  createWholesaleOrder(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Headers("x-location-id") locationId: string | undefined,
    @Body() body: CreateOrderDto,
  ) {
    return this.adaptersService.createWholesaleOrder({ groupId, subsidiaryId, locationId, body });
  }

  @Permissions("orders.fulfill")
  @Post("wholesale/orders/:order_id/fulfill")
  fulfillWholesaleOrder(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Param("order_id", new ParseUUIDPipe()) orderId: string,
  ) {
    return this.adaptersService.fulfillWholesaleOrder({ groupId, subsidiaryId, orderId });
  }

  @Permissions("orders.write", "payments.intent.create", "inventory.stock.reserve", "loyalty.points.issue")
  @Post("retail/checkout")
  retailCheckout(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Headers("x-location-id") locationId: string | undefined,
    @Body() body: AdapterCheckoutDto,
  ) {
    return this.adaptersService.retailCheckout({ groupId, subsidiaryId, locationId, body });
  }

  @Permissions("orders.write", "payments.intent.create")
  @Post("digital/checkout")
  digitalCheckout(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Headers("x-location-id") locationId: string | undefined,
    @Body() body: AdapterCheckoutDto,
  ) {
    return this.adaptersService.digitalCheckout({ groupId, subsidiaryId, locationId, body });
  }

  @Permissions("credit.reseller.write", "credit.account.write", "credit.limit.write")
  @Post("credit/onboard")
  onboardReseller(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Body() body: ResellerOnboardDto,
  ) {
    return this.adaptersService.onboardReseller({ groupId, subsidiaryId, body });
  }

  @Permissions("credit.repayment.write")
  @Post("credit/repayments")
  recordResellerRepayment(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Body() body: CreateRepaymentDto,
  ) {
    return this.adaptersService.recordResellerRepayment({ groupId, subsidiaryId, body });
  }
}
