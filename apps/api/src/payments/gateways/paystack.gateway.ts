import { Injectable } from "@nestjs/common";
import { createHmac } from "crypto";
import {
  PaymentGateway,
  PaymentIntentCreateParams,
  PaymentIntentCreateResult,
  PaymentRefundResult,
  WebhookParseResult,
  WebhookVerifyParams,
  ReconcileParams,
  ReconcileResult,
  PaymentCaptureResult,
} from "./payment-gateway";

@Injectable()
export class PaystackGateway implements PaymentGateway {
  readonly name = "paystack";

  async createPaymentIntent(params: PaymentIntentCreateParams): Promise<PaymentIntentCreateResult> {
    return {
      reference: params.reference,
      status: "requires_capture",
      checkout_url: `https://checkout.paystack.com/${params.reference}`,
    };
  }

  async capturePaymentIntent(reference: string): Promise<PaymentCaptureResult> {
    return {
      status: "captured",
      reference,
    };
  }

  async createRefund(reference: string, _amount: number): Promise<PaymentRefundResult> {
    return {
      status: "processing",
      reference,
    };
  }

  parseWebhook(payload: unknown): WebhookParseResult | null {
    const data = payload as { event?: string; data?: any };
    const reference = data?.data?.reference;
    if (!reference) return null;

    const event = data?.event ?? "unknown";
    const status = this.mapEventToStatus(event);

    return {
      reference,
      status,
      event_type: event,
      amount: data?.data?.amount ? Number(data.data.amount) / 100 : undefined,
      currency: data?.data?.currency,
      raw: payload,
    };
  }

  verifyWebhook(params: WebhookVerifyParams): boolean {
    const secret = process.env.PAYSTACK_SECRET;
    const signature = this.readHeader(params.headers["x-paystack-signature"]);
    if (!secret || !signature) return false;
    const hash = createHmac("sha512", secret).update(params.rawBody).digest("hex");
    return hash === signature;
  }

  async reconcile(params: ReconcileParams): Promise<ReconcileResult> {
    return {
      provider: this.name,
      from: params.from?.toISOString(),
      to: params.to?.toISOString(),
      status: "pending",
      message: "Reconciliation stub; integrate Paystack transactions API.",
    };
  }

  private mapEventToStatus(event: string) {
    if (event === "charge.success") return "captured";
    if (event === "charge.failed") return "failed";
    if (event.startsWith("refund")) return "refunded";
    return "processing";
  }

  private readHeader(value: string | string[] | undefined): string | undefined {
    if (!value) return undefined;
    return Array.isArray(value) ? value[0] : value;
  }
}
