import { Injectable } from "@nestjs/common";
import {
  PaymentGateway,
  PaymentIntentCreateParams,
  PaymentIntentCreateResult,
  PaymentCaptureResult,
  PaymentRefundResult,
  ReconcileParams,
  ReconcileResult,
} from "./payment-gateway";

@Injectable()
export class ManualGateway implements PaymentGateway {
  readonly name = "manual";

  async createPaymentIntent(params: PaymentIntentCreateParams): Promise<PaymentIntentCreateResult> {
    return {
      reference: params.reference,
      status: "requires_capture",
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

  async reconcile(params: ReconcileParams): Promise<ReconcileResult> {
    return {
      provider: this.name,
      from: params.from?.toISOString(),
      to: params.to?.toISOString(),
      status: "skipped",
      message: "Manual gateway does not reconcile transactions.",
    };
  }
}
