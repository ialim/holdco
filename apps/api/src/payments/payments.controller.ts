import { BadRequestException, Body, Controller, Headers, Param, ParseUUIDPipe, Post, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { Permissions } from "../auth/permissions.decorator";
import { PermissionsGuard } from "../auth/permissions.guard";
import { CreatePaymentIntentDto } from "./dto/create-payment-intent.dto";
import { CreateRefundDto } from "./dto/create-refund.dto";
import { ReconcilePaymentsDto } from "./dto/reconcile-payments.dto";
import { PaymentsService } from "./payments.service";
import { PaymentsReconciliationService } from "./payments.reconciliation.service";

@Controller("v1")
@UseGuards(PermissionsGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly reconciliationService: PaymentsReconciliationService,
  ) {}

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

  @Permissions("payments.reconcile")
  @Post("payments/reconcile")
  reconcilePayments(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Body() body: ReconcilePaymentsDto,
  ) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    return this.reconciliationService.reconcile({
      provider: body.provider,
      from: body.from ? new Date(body.from) : undefined,
      to: body.to ? new Date(body.to) : undefined,
    });
  }
}
