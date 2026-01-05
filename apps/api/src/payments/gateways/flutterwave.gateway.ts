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
    const secret = this.requireSecret();
    const baseUrl = this.baseUrl();
    const paymentOptions = this.buildPaymentOptions(params);
    const payload = {
      tx_ref: params.reference,
      amount: params.amount,
      currency: params.currency,
      redirect_url: params.redirectUrl ?? process.env.FLW_REDIRECT_URL,
      customer: {
        email: params.customerEmail,
      },
      payment_options: paymentOptions.length ? paymentOptions.join(",") : undefined,
      meta: params.metadata,
    };

    const response = await fetch(`${baseUrl}/payments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await this.parseResponse(response);
    return {
      reference: params.reference,
      status: "requires_capture",
      checkout_url: data.data?.link,
    };
  }

  async capturePaymentIntent(reference: string): Promise<PaymentCaptureResult> {
    const secret = this.requireSecret();
    const baseUrl = this.baseUrl();
    const response = await fetch(`${baseUrl}/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secret}` },
    });
    const data = await this.parseResponse(response);
    const status = this.mapEventToStatus(data.data?.event_type ?? "", data.data?.status);
    return {
      status,
      reference,
    };
  }

  async createRefund(reference: string, _amount: number): Promise<PaymentRefundResult> {
    const secret = this.requireSecret();
    const baseUrl = this.baseUrl();
    const verify = await fetch(`${baseUrl}/transactions/verify_by_reference?tx_ref=${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secret}` },
    });
    const verifyData = await this.parseResponse(verify);
    const transactionId = verifyData.data?.id;
    if (!transactionId) {
      throw new Error("Flutterwave transaction id not found for refund");
    }

    const payload = _amount ? { amount: _amount } : {};
    const response = await fetch(`${baseUrl}/transactions/${transactionId}/refund`, {
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
    const secret = this.requireSecret();
    const baseUrl = this.baseUrl();
    const query = new URLSearchParams();
    if (params.from) query.set("from", params.from.toISOString().slice(0, 10));
    if (params.to) query.set("to", params.to.toISOString().slice(0, 10));

    const response = await fetch(`${baseUrl}/transactions?${query.toString()}`, {
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

  private baseUrl() {
    return process.env.FLW_BASE_URL ?? "https://api.flutterwave.com/v3";
  }

  private requireSecret() {
    const secret = process.env.FLW_SECRET_KEY;
    if (!secret) {
      throw new Error("FLW_SECRET_KEY is required");
    }
    return secret;
  }

  private buildPaymentOptions(params: PaymentIntentCreateParams) {
    const map: Record<string, string> = {
      card: "card",
      transfer: "banktransfer",
      ussd: "ussd",
    };
    const requested = params.paymentMethod ? [params.paymentMethod] : params.allowedMethods ?? [];
    return requested.map((method) => map[method]).filter(Boolean);
  }

  private async parseResponse(response: Response) {
    const json = await response.json().catch(() => ({}));
    if (!response.ok || json.status === "error") {
      const message = json.message ?? `Flutterwave request failed (${response.status})`;
      throw new Error(message);
    }
    return json;
  }
}
