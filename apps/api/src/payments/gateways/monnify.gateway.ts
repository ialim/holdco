import { Injectable } from "@nestjs/common";
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
export class MonnifyGateway implements PaymentGateway {
  readonly name = "monnify";

  async createPaymentIntent(params: PaymentIntentCreateParams): Promise<PaymentIntentCreateResult> {
    return {
      reference: params.reference,
      status: "requires_capture",
    };
  }

  async capturePaymentIntent(reference: string): Promise<PaymentCaptureResult> {
    return {
      status: "processing",
      reference,
    };
  }

  async createRefund(reference: string, _amount: number): Promise<PaymentRefundResult> {
    return {
      status: "processing",
      reference,
    };
  }

  parseWebhook(_payload: unknown): WebhookParseResult | null {
    return null;
  }

  verifyWebhook(_params: WebhookVerifyParams): boolean {
    return false;
  }

  async reconcile(params: ReconcileParams): Promise<ReconcileResult> {
    return {
      provider: this.name,
      from: params.from?.toISOString(),
      to: params.to?.toISOString(),
      status: "pending",
      message: "Monnify gateway stub; implement reconciliation when enabled.",
    };
  }
}
