import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { randomUUID } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePaymentIntentDto } from "./dto/create-payment-intent.dto";
import { CreateRefundDto } from "./dto/create-refund.dto";
import { PaymentGatewayFactory } from "./payment-gateway.factory";
import { PaymentIntentCreateResult } from "./gateways/payment-gateway";

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gatewayFactory: PaymentGatewayFactory,
  ) {}

  private readonly channelMethods: Record<string, string[]> = {
    retail: ["card", "transfer", "ussd"],
    digital: ["card", "transfer", "ussd"],
    wholesale: ["transfer"],
    credit: ["transfer"],
  };

  async createPaymentIntent(groupId: string, subsidiaryId: string, body: CreatePaymentIntentDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const order = await this.prisma.order.findFirst({
      where: { id: body.order_id, groupId, subsidiaryId },
      include: { customer: true },
    });
    if (!order) throw new NotFoundException("Order not found");

    const channel = (order.channel ?? "retail").toLowerCase();
    const allowedMethods = this.channelMethods[channel] ?? this.channelMethods.retail;

    if (body.payment_method && !allowedMethods.includes(body.payment_method)) {
      throw new BadRequestException("Payment method is not supported for this channel");
    }

    const provider = (body.provider ?? this.gatewayFactory.defaultProvider()).toLowerCase();
    if (body.provider && !this.gatewayFactory.hasProvider(provider)) {
      throw new BadRequestException("Unsupported payment provider");
    }

    const customerEmail = body.customer_email ?? order.customer?.email ?? undefined;
    if (!customerEmail && provider !== "moniepoint") {
      throw new BadRequestException("Customer email is required to initialize payment");
    }

    const fallbackProvider = this.gatewayFactory.fallbackEnabled() ? this.gatewayFactory.fallbackProvider() : undefined;
    const providerChain = [provider];
    if (fallbackProvider && fallbackProvider !== provider && this.gatewayFactory.hasProvider(fallbackProvider)) {
      providerChain.push(fallbackProvider);
    }

    const reference = `pi_${randomUUID()}`;
    let gatewayResult: PaymentIntentCreateResult | undefined;
    let selectedProvider = provider;
    let lastError: unknown;

    for (const candidate of providerChain) {
      const gateway = this.gatewayFactory.get(candidate);
      try {
        gatewayResult = await gateway.createPaymentIntent({
          amount: body.amount,
          currency: body.currency,
          reference,
          orderId: body.order_id,
          customerEmail,
          channel,
          paymentMethod: body.payment_method,
          allowedMethods,
          terminalSerial: body.terminal_serial,
          transactionType: body.transaction_type,
          merchantReference: reference,
          metadata: {
            order_no: order.orderNo,
            channel,
          },
        });
        selectedProvider = gateway.name;
        break;
      } catch (error) {
        lastError = error;
      }
    }

    if (!gatewayResult) {
      const message = lastError instanceof Error ? lastError.message : "Payment initialization failed";
      throw new BadRequestException(message);
    }
    const status = gatewayResult.status ?? (body.capture_method === "manual" ? "requires_capture" : "requires_capture");

    const intent = await this.prisma.paymentIntent.create({
      data: {
        groupId,
        subsidiaryId,
        orderId: body.order_id,
        amount: body.amount,
        currency: body.currency,
        status,
        provider: selectedProvider,
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

    await this.prisma.orderPayment.updateMany({
      where: { paymentIntentId: intent.id },
      data: { status: intent.status, reference: intent.reference ?? undefined },
    });
    await this.refreshOrderPaymentSummary(groupId, subsidiaryId, intent.orderId);

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

  private async refreshOrderPaymentSummary(groupId: string, subsidiaryId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, groupId, subsidiaryId },
    });
    if (!order) return;

    const captured = await this.prisma.orderPayment.aggregate({
      where: { orderId, groupId, subsidiaryId, status: "captured" },
      _sum: { amount: true },
    });
    const paidAmount = Number(captured._sum.amount ?? 0);
    const paymentStatus =
      paidAmount >= Number(order.totalAmount)
        ? "paid"
        : paidAmount > 0
          ? "partial"
          : "unpaid";

    await this.prisma.order.update({
      where: { id: order.id },
      data: { paidAmount, paymentStatus },
    });
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
