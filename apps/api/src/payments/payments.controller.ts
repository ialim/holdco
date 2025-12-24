import { BadRequestException, Body, Controller, Headers, Param, ParseUUIDPipe, Post, Req, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { Request } from "express";
import { Permissions } from "../auth/permissions.decorator";
import { PermissionsGuard } from "../auth/permissions.guard";
import { AuditService } from "../audit/audit.service";
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
    private readonly auditService: AuditService,
  ) {}

  @Permissions("payments.intent.create")
  @Post("payments/intents")
  async createPaymentIntent(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Body() body: CreatePaymentIntentDto,
    @Req() req: Request,
  ) {
    const intent = await this.paymentsService.createPaymentIntent(groupId, subsidiaryId, body);
    const actorId = ((req as any).user?.sub ?? (req as any).user?.id ?? (req as any).user?.userId) as string | undefined;
    await this.auditService.record({
      groupId,
      subsidiaryId,
      actorId,
      action: "payment.intent.create",
      entityType: "payment_intent",
      entityId: intent.id,
      payload: {
        order_id: intent.order_id,
        amount: intent.amount,
        currency: intent.currency,
        provider: intent.provider,
      },
    });
    return intent;
  }

  @Permissions("payments.capture")
  @Post("payments/:payment_id/capture")
  async capturePaymentIntent(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Param("payment_id", new ParseUUIDPipe()) paymentId: string,
    @Req() req: Request,
  ) {
    const intent = await this.paymentsService.capturePaymentIntent(groupId, subsidiaryId, paymentId);
    const actorId = ((req as any).user?.sub ?? (req as any).user?.id ?? (req as any).user?.userId) as string | undefined;
    await this.auditService.record({
      groupId,
      subsidiaryId,
      actorId,
      action: "payment.intent.capture",
      entityType: "payment_intent",
      entityId: intent.id,
      payload: { status: intent.status },
    });
    return intent;
  }

  @Permissions("payments.refund")
  @Post("refunds")
  async createRefund(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Body() body: CreateRefundDto,
    @Req() req: Request,
  ) {
    const refund = await this.paymentsService.createRefund(groupId, subsidiaryId, body);
    const actorId = ((req as any).user?.sub ?? (req as any).user?.id ?? (req as any).user?.userId) as string | undefined;
    await this.auditService.record({
      groupId,
      subsidiaryId,
      actorId,
      action: "payment.refund.create",
      entityType: "refund",
      entityId: refund.id,
      payload: {
        payment_id: refund.payment_id,
        amount: refund.amount,
        status: refund.status,
      },
    });
    return refund;
  }

  @Permissions("payments.reconcile")
  @Post("payments/reconcile")
  async reconcilePayments(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Body() body: ReconcilePaymentsDto,
    @Req() req: Request,
  ) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const result = await this.reconciliationService.reconcile({
      provider: body.provider,
      from: body.from ? new Date(body.from) : undefined,
      to: body.to ? new Date(body.to) : undefined,
    });

    const actorId = ((req as any).user?.sub ?? (req as any).user?.id ?? (req as any).user?.userId) as string | undefined;
    await this.auditService.record({
      groupId,
      subsidiaryId,
      actorId,
      action: "payment.reconcile",
      entityType: "payment_reconciliation",
      payload: {
        provider: body.provider,
        from: body.from,
        to: body.to,
        status: result.status,
      },
    });

    return result;
  }
}
