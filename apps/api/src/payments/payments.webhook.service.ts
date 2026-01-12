import { BadRequestException, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { PaymentGatewayFactory } from "./payment-gateway.factory";
import { WebhookParseResult, WebhookVerifyParams } from "./gateways/payment-gateway";

@Injectable()
export class PaymentsWebhookService {
  private readonly logger = new Logger(PaymentsWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gatewayFactory: PaymentGatewayFactory,
  ) {}

  async handleWebhook(params: {
    provider: string;
    headers: Record<string, string | string[] | undefined>;
    payload: unknown;
    rawBody: string;
  }) {
    const gateway = this.gatewayFactory.get(params.provider);

    if (!gateway.verifyWebhook) {
      throw new UnauthorizedException("Webhook signature verification is required");
    }
    const ok = gateway.verifyWebhook(this.buildVerifyParams(params.headers, params.rawBody));
    if (!ok) throw new UnauthorizedException("Invalid webhook signature");

    if (!gateway.parseWebhook) {
      throw new BadRequestException("Unsupported webhook provider");
    }

    const event = gateway.parseWebhook(params.payload);
    if (!event) return { status: "ignored" };

    const updated = await this.applyWebhook(event, gateway.name);
    return { status: "ok", updated };
  }

  private async applyWebhook(event: WebhookParseResult, provider: string) {
    const intent = await this.prisma.paymentIntent.findFirst({
      where: { reference: event.reference, provider },
    });

    if (!intent) {
      this.logger.warn(`Payment intent not found for ${provider}:${event.reference}`);
      return false;
    }

    const updated = await this.prisma.paymentIntent.update({
      where: { id: intent.id },
      data: { status: event.status },
    });

    await this.prisma.orderPayment.updateMany({
      where: { paymentIntentId: updated.id },
      data: { status: updated.status },
    });

    await this.refreshOrderPaymentSummary(updated.groupId, updated.subsidiaryId, updated.orderId);

    return true;
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

  private buildVerifyParams(headers: Record<string, string | string[] | undefined>, rawBody: string): WebhookVerifyParams {
    return { headers, rawBody };
  }
}
