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
    const secret = this.requireSecret();
    const baseUrl = this.baseUrl();
    const channels = this.buildChannels(params);
    const payload = {
      email: params.customerEmail,
      amount: Math.round(params.amount * 100),
      reference: params.reference,
      currency: params.currency,
      channels: channels.length ? channels : undefined,
      callback_url: params.redirectUrl ?? process.env.PAYSTACK_CALLBACK_URL,
      metadata: params.metadata,
    };

    const response = await fetch(`${baseUrl}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await this.parseResponse(response);
    return {
      reference: data.data?.reference ?? params.reference,
      status: "requires_capture",
      checkout_url: data.data?.authorization_url,
    };
  }

  async capturePaymentIntent(reference: string): Promise<PaymentCaptureResult> {
    const secret = this.requireSecret();
    const baseUrl = this.baseUrl();
    const response = await fetch(`${baseUrl}/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secret}` },
    });
    const data = await this.parseResponse(response);
    const status = this.mapTransactionStatus(data.data?.status);
    return {
      status,
      reference: data.data?.reference ?? reference,
    };
  }

  async createRefund(reference: string, _amount: number): Promise<PaymentRefundResult> {
    const secret = this.requireSecret();
    const baseUrl = this.baseUrl();
    const payload = {
      transaction: reference,
      amount: _amount ? Math.round(_amount * 100) : undefined,
    };
    const response = await fetch(`${baseUrl}/refund`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await this.parseResponse(response);
    return {
      status: data.data?.status ?? "processing",
      reference: data.data?.transaction_reference ?? reference,
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
    const secret = process.env.PAYSTACK_SECRET_KEY ?? process.env.PAYSTACK_SECRET;
    const signature = this.readHeader(params.headers["x-paystack-signature"]);
    if (!secret || !signature) return false;
    const hash = createHmac("sha512", secret).update(params.rawBody).digest("hex");
    return hash === signature;
  }

  async reconcile(params: ReconcileParams): Promise<ReconcileResult> {
    const secret = this.requireSecret();
    const baseUrl = this.baseUrl();
    const query = new URLSearchParams();
    if (params.from) query.set("from", Math.floor(params.from.getTime() / 1000).toString());
    if (params.to) query.set("to", Math.floor(params.to.getTime() / 1000).toString());

    const response = await fetch(`${baseUrl}/transaction?${query.toString()}`, {
      headers: { Authorization: `Bearer ${secret}` },
    });
    const data = await this.parseResponse(response);
    const total = data.meta?.total ?? data.data?.length ?? 0;
    return {
      provider: this.name,
      from: params.from?.toISOString(),
      to: params.to?.toISOString(),
      status: "ok",
      message: `Fetched ${total} transactions.`,
    };
  }

  private mapEventToStatus(event: string) {
    if (event === "charge.success") return "captured";
    if (event === "charge.failed") return "failed";
    if (event.startsWith("refund")) return "refunded";
    return "processing";
  }

  private mapTransactionStatus(status?: string) {
    if (status === "success") return "captured";
    if (status === "failed") return "failed";
    return "processing";
  }

  private readHeader(value: string | string[] | undefined): string | undefined {
    if (!value) return undefined;
    return Array.isArray(value) ? value[0] : value;
  }

  private baseUrl() {
    return process.env.PAYSTACK_BASE_URL ?? "https://api.paystack.co";
  }

  private requireSecret() {
    const secret = process.env.PAYSTACK_SECRET_KEY ?? process.env.PAYSTACK_SECRET;
    if (!secret) {
      throw new Error("PAYSTACK_SECRET_KEY is required");
    }
    return secret;
  }

  private buildChannels(params: PaymentIntentCreateParams) {
    const map: Record<string, string> = {
      card: "card",
      transfer: "bank_transfer",
      ussd: "ussd",
    };
    const requested = params.paymentMethod ? [params.paymentMethod] : params.allowedMethods ?? [];
    return requested
      .map((method) => map[method])
      .filter((channel): channel is string => Boolean(channel));
  }

  private async parseResponse(response: Response) {
    const json = await response.json().catch(() => ({}));
    if (!response.ok || json.status === false) {
      const message = json.message ?? `Paystack request failed (${response.status})`;
      throw new Error(message);
    }
    return json;
  }
}
