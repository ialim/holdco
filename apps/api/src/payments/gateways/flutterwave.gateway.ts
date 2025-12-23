import { Injectable } from "@nestjs/common";
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
export class FlutterwaveGateway implements PaymentGateway {
  readonly name = "flutterwave";

  async createPaymentIntent(params: PaymentIntentCreateParams): Promise<PaymentIntentCreateResult> {
    return {
      reference: params.reference,
      status: "requires_capture",
      checkout_url: `https://checkout.flutterwave.com/v3/hosted/pay/${params.reference}`,
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
    const reference = data?.data?.tx_ref ?? data?.data?.reference;
    if (!reference) return null;

    const event = data?.event ?? "unknown";
    const status = this.mapEventToStatus(event, data?.data?.status);

    return {
      reference,
      status,
      event_type: event,
      amount: data?.data?.amount ? Number(data.data.amount) : undefined,
      currency: data?.data?.currency,
      raw: payload,
    };
  }

  verifyWebhook(params: WebhookVerifyParams): boolean {
    const secret = process.env.FLW_SECRET_HASH;
    const signature = this.readHeader(params.headers["verif-hash"]);
    if (!secret || !signature) return false;
    return signature === secret;
  }

  async reconcile(params: ReconcileParams): Promise<ReconcileResult> {
    return {
      provider: this.name,
      from: params.from?.toISOString(),
      to: params.to?.toISOString(),
      status: "pending",
      message: "Reconciliation stub; integrate Flutterwave transactions API.",
    };
  }

  private mapEventToStatus(event: string, status?: string) {
    if (event === "charge.completed" || status === "successful") return "captured";
    if (status === "failed") return "failed";
    if (event.startsWith("refund")) return "refunded";
    return "processing";
  }

  private readHeader(value: string | string[] | undefined): string | undefined {
    if (!value) return undefined;
    return Array.isArray(value) ? value[0] : value;
  }
}
