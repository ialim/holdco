import { Body, Controller, Headers, Param, ParseUUIDPipe, Post, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { Permissions } from "../auth/permissions.decorator";
import { PermissionsGuard } from "../auth/permissions.guard";
import { CreatePaymentIntentDto } from "./dto/create-payment-intent.dto";
import { CreateRefundDto } from "./dto/create-refund.dto";
import { PaymentsService } from "./payments.service";

@Controller("v1")
@UseGuards(PermissionsGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Permissions("payments.intent.create")
  @Post("payments/intents")
  createPaymentIntent(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Body() body: CreatePaymentIntentDto,
  ) {
    return this.paymentsService.createPaymentIntent(groupId, subsidiaryId, body);
  }

  @Permissions("payments.capture")
  @Post("payments/:payment_id/capture")
  capturePaymentIntent(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Param("payment_id", new ParseUUIDPipe()) paymentId: string,
  ) {
    return this.paymentsService.capturePaymentIntent(groupId, subsidiaryId, paymentId);
  }

  @Permissions("payments.refund")
  @Post("refunds")
  createRefund(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Body() body: CreateRefundDto,
  ) {
    return this.paymentsService.createRefund(groupId, subsidiaryId, body);
  }
}
