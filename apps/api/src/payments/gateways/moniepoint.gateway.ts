import { Injectable } from "@nestjs/common";
import { createHmac } from "crypto";
import {
  PaymentGateway,
  PaymentIntentCreateParams,
  PaymentIntentCreateResult,
  PaymentCaptureResult,
  PaymentRefundResult,
  ReconcileParams,
  ReconcileResult,
  WebhookParseResult,
  WebhookVerifyParams,
} from "./payment-gateway";

@Injectable()
export class MoniepointGateway implements PaymentGateway {
  readonly name = "moniepoint";

  async createPaymentIntent(params: PaymentIntentCreateParams): Promise<PaymentIntentCreateResult> {
    const token = this.requireToken();
    const baseUrl = this.baseUrl();
    const reference = params.merchantReference ?? params.reference;
    const paymentMethod = this.mapPaymentMethod(params.paymentMethod, params.allowedMethods);
    const transactionType = this.mapTransactionType(params.transactionType, params.paymentMethod);
    const terminalSerial =
      params.terminalSerial ??
      this.readMetadata(params.metadata, ["terminalSerial", "terminal_serial", "terminal_serial_number"]) ??
      process.env.MONIEPOINT_TERMINAL_SERIAL;

    if (!terminalSerial) {
      throw new Error("MONIEPOINT_TERMINAL_SERIAL is required");
    }

    const payload = {
      terminalSerial,
      amount: this.scaleAmount(params.amount),
      merchantReference: reference,
      transactionType,
      paymentMethod,
    };

    const response = await fetch(`${baseUrl}/v1/transactions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    await this.parseResponse(response);

    return {
      reference,
      status: "requires_capture",
    };
  }

  async capturePaymentIntent(reference: string): Promise<PaymentCaptureResult> {
    const token = this.requireToken();
    const baseUrl = this.baseUrl();
    const response = await fetch(`${baseUrl}/v1/transactions/merchants/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await this.parseResponse(response);
    const status = this.mapProcessingStatus(data.processingStatus ?? data?.data?.processingStatus);
    return {
      status,
      reference: data.merchantReference ?? reference,
    };
  }

  async createRefund(reference: string, _amount: number): Promise<PaymentRefundResult> {
    return {
      status: "processing",
      reference,
    };
  }

  parseWebhook(payload: unknown): WebhookParseResult | null {
    const data = payload as Record<string, any>;
    const nested = data?.payload ?? {};
    const reference =
      data?.merchantReference ??
      nested?.merchantReference ??
      data?.transactionReference ??
      nested?.transactionReference;
    if (!reference) return null;

    const processingStatus =
      data?.processingStatus ??
      nested?.processingStatus ??
      data?.status ??
      nested?.status ??
      data?.responseMessage;
    const status = this.mapProcessingStatus(processingStatus);
    const amount = data?.actualAmount ?? nested?.actualAmount ?? data?.amount ?? nested?.amount;
    const currency = data?.currency ?? nested?.currency;
    const eventType = data?.eventType ?? data?.event_type ?? "moniepoint.pos.event";

    return {
      reference,
      status,
      event_type: eventType,
      amount: typeof amount === "number" ? amount : undefined,
      currency,
      raw: payload,
    };
  }

  verifyWebhook(params: WebhookVerifyParams): boolean {
    const secret = process.env.MONIEPOINT_WEBHOOK_SECRET;
    if (secret) {
      const signature =
        this.readHeader(params.headers["x-moniepoint-signature"]) ??
        this.readHeader(params.headers["x-signature"]);
      if (!signature) return false;
      const digest = createHmac("sha256", secret).update(params.rawBody).digest("hex");
      return digest === signature;
    }

    const username = process.env.MONIEPOINT_WEBHOOK_USERNAME;
    const password = process.env.MONIEPOINT_WEBHOOK_PASSWORD;
    if (username && password) {
      const auth = this.readHeader(params.headers["authorization"]);
      if (!auth?.startsWith("Basic ")) return false;
      const token = auth.slice(6).trim();
      const expected = Buffer.from(`${username}:${password}`).toString("base64");
      return token === expected;
    }

    return (process.env.MONIEPOINT_WEBHOOK_ALLOW_INSECURE ?? "false").toLowerCase() === "true";
  }

  async reconcile(params: ReconcileParams): Promise<ReconcileResult> {
    return {
      provider: this.name,
      from: params.from?.toISOString(),
      to: params.to?.toISOString(),
      status: "pending",
      message: "Moniepoint gateway stub; implement reconciliation when enabled.",
    };
  }

  private mapProcessingStatus(status?: string) {
    const normalized = (status ?? "").toString().toUpperCase();
    if (["SUCCESSFUL", "COMPLETED"].includes(normalized)) return "captured";
    if (normalized === "FAILED") return "failed";
    if (normalized === "CANCELLED") return "cancelled";
    return "processing";
  }

  private mapPaymentMethod(method?: string, allowedMethods?: string[]) {
    const normalized = method?.toLowerCase();
    if (normalized === "card") return "CARD_PURCHASE";
    if (normalized === "transfer") return "POS_TRANSFER";
    if (normalized === "ussd") return "ANY";
    if (allowedMethods?.includes("card")) return "CARD_PURCHASE";
    if (allowedMethods?.includes("transfer")) return "POS_TRANSFER";
    return "ANY";
  }

  private mapTransactionType(transactionType?: string, method?: string) {
    const allowed = new Set([
      "PURCHASE",
      "BOOM",
      "CREDIT",
      "DEBIT",
      "WITHDRAWAL",
      "POS_TRANSFER",
      "TRANSFERS",
      "CARD_TRANSFER",
      "BILL_PAYMENT",
      "AIRTIME",
      "COLLECTION",
      "PAYCODE",
      "DATA_PURCHASE",
    ]);
    const candidate = (transactionType ?? "").toUpperCase();
    if (allowed.has(candidate)) return candidate;
    if ((method ?? "").toLowerCase() === "transfer") return "POS_TRANSFER";
    return "PURCHASE";
  }

  private scaleAmount(amount: number) {
    const multiplierRaw = Number(process.env.MONIEPOINT_AMOUNT_MULTIPLIER ?? "100");
    const multiplier = Number.isFinite(multiplierRaw) && multiplierRaw > 0 ? multiplierRaw : 100;
    return Math.round(amount * multiplier);
  }

  private readMetadata(
    metadata: Record<string, string | number | boolean | null | undefined> | undefined,
    keys: string[],
  ) {
    if (!metadata) return undefined;
    for (const key of keys) {
      const value = metadata[key];
      if (typeof value === "string" && value.trim()) return value;
    }
    return undefined;
  }

  private baseUrl() {
    return process.env.MONIEPOINT_BASE_URL ?? "https://api.pos.moniepoint.com";
  }

  private requireToken() {
    const token = process.env.MONIEPOINT_API_TOKEN ?? process.env.MONIEPOINT_BEARER_TOKEN;
    if (!token) {
      throw new Error("MONIEPOINT_API_TOKEN is required");
    }
    return token;
  }

  private readHeader(value: string | string[] | undefined): string | undefined {
    if (!value) return undefined;
    return Array.isArray(value) ? value[0] : value;
  }

  private async parseResponse(response: Response) {
    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = json.message ?? json.error ?? `Moniepoint request failed (${response.status})`;
      throw new Error(message);
    }
    return json;
  }
}
