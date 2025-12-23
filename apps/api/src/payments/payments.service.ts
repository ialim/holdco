import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePaymentIntentDto } from "./dto/create-payment-intent.dto";
import { CreateRefundDto } from "./dto/create-refund.dto";
import { PaymentGatewayFactory } from "./payment-gateway.factory";

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gatewayFactory: PaymentGatewayFactory,
  ) {}

  async createPaymentIntent(groupId: string, subsidiaryId: string, body: CreatePaymentIntentDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const provider = body.provider ?? this.gatewayFactory.defaultProvider();
    const gateway = this.gatewayFactory.get(provider);
    const reference = `pi_${randomUUID()}`;
    const gatewayResult = await gateway.createPaymentIntent({
      amount: body.amount,
      currency: body.currency,
      reference,
      orderId: body.order_id,
    });
    const status = gatewayResult.status ?? (body.capture_method === "manual" ? "requires_capture" : "requires_capture");

    const intent = await this.prisma.paymentIntent.create({
      data: {
        groupId,
        subsidiaryId,
        orderId: body.order_id,
        amount: body.amount,
        currency: body.currency,
        status,
        provider: gateway.name,
        reference: gatewayResult.reference ?? reference,
      },
    });

    return {
      id: intent.id,
      order_id: intent.orderId,
      amount: Number(intent.amount),
      currency: intent.currency,
      status: intent.status,
      provider: intent.provider ?? undefined,
      reference: intent.reference ?? undefined,
      checkout_url: gatewayResult.checkout_url,
    };
  }

  async capturePaymentIntent(groupId: string, subsidiaryId: string, paymentId: string) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const existing = await this.prisma.paymentIntent.findFirst({ where: { id: paymentId, groupId, subsidiaryId } });
    if (!existing) throw new NotFoundException("Payment intent not found");

    const gateway = this.gatewayFactory.get(existing.provider ?? undefined);
    const captureResult = gateway.capturePaymentIntent
      ? await gateway.capturePaymentIntent(existing.reference ?? existing.id)
      : { status: "captured" };

    const intent = await this.prisma.paymentIntent.update({
      where: { id: paymentId },
      data: {
        status: captureResult.status ?? "captured",
        reference: captureResult.reference ?? existing.reference,
      },
    });

    return {
      id: intent.id,
      order_id: intent.orderId,
      amount: Number(intent.amount),
      currency: intent.currency,
      status: intent.status,
      provider: intent.provider ?? undefined,
      reference: intent.reference ?? undefined,
    };
  }

  async createRefund(groupId: string, subsidiaryId: string, body: CreateRefundDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const intent = await this.prisma.paymentIntent.findFirst({
      where: { id: body.payment_id, groupId, subsidiaryId },
    });
    if (!intent) throw new NotFoundException("Payment intent not found");

    const gateway = this.gatewayFactory.get(intent.provider ?? undefined);
    const refundResult = gateway.createRefund
      ? await gateway.createRefund(intent.reference ?? intent.id, body.amount)
      : { status: "processing" };

    const refund = await this.prisma.refund.create({
      data: {
        groupId,
        subsidiaryId,
        paymentIntentId: body.payment_id,
        amount: body.amount,
        reason: body.reason,
        status: refundResult.status ?? "pending",
      },
    });

    return {
      id: refund.id,
      payment_id: refund.paymentIntentId,
      amount: Number(refund.amount),
      status: refund.status,
    };
  }
}
