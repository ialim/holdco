export type PaymentIntentCreateParams = {
  amount: number;
  currency: string;
  reference: string;
  orderId: string;
};

export type PaymentIntentCreateResult = {
  reference: string;
  status: string;
  checkout_url?: string;
};

export type PaymentCaptureResult = {
  status: string;
  reference?: string;
};

export type PaymentRefundResult = {
  status: string;
  reference?: string;
};

export type WebhookParseResult = {
  reference: string;
  status: string;
  event_type: string;
  amount?: number;
  currency?: string;
  raw: unknown;
};

export type WebhookVerifyParams = {
  headers: Record<string, string | string[] | undefined>;
  rawBody: string;
};

export type ReconcileParams = {
  from?: Date;
  to?: Date;
};

export type ReconcileResult = {
  provider: string;
  from?: string;
  to?: string;
  status: string;
  message?: string;
};

export interface PaymentGateway {
  readonly name: string;
  createPaymentIntent(params: PaymentIntentCreateParams): Promise<PaymentIntentCreateResult>;
  capturePaymentIntent?(reference: string): Promise<PaymentCaptureResult>;
  createRefund?(reference: string, amount: number): Promise<PaymentRefundResult>;
  parseWebhook?(payload: unknown): WebhookParseResult | null;
  verifyWebhook?(params: WebhookVerifyParams): boolean;
  reconcile?(params: ReconcileParams): Promise<ReconcileResult>;
}
