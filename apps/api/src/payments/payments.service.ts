import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePaymentIntentDto } from "./dto/create-payment-intent.dto";
import { CreateRefundDto } from "./dto/create-refund.dto";

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async createPaymentIntent(groupId: string, subsidiaryId: string, body: CreatePaymentIntentDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const status = body.capture_method === "manual" ? "requires_capture" : "requires_capture";

    const intent = await this.prisma.paymentIntent.create({
      data: {
        groupId,
        subsidiaryId,
        orderId: body.order_id,
        amount: body.amount,
        currency: body.currency,
        status,
        provider: body.provider,
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

  async capturePaymentIntent(groupId: string, subsidiaryId: string, paymentId: string) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const existing = await this.prisma.paymentIntent.findFirst({ where: { id: paymentId, groupId, subsidiaryId } });
    if (!existing) throw new NotFoundException("Payment intent not found");

    const intent = await this.prisma.paymentIntent.update({
      where: { id: paymentId },
      data: { status: "captured" },
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

    const refund = await this.prisma.refund.create({
      data: {
        groupId,
        subsidiaryId,
        paymentIntentId: body.payment_id,
        amount: body.amount,
        reason: body.reason,
        status: "pending",
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
