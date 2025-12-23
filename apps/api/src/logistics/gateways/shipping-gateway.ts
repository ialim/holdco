export type ShipmentCreateParams = {
  orderId: string;
  carrier: string;
};

export type ShipmentCreateResult = {
  tracking_no?: string;
  status: string;
};

export type ShipmentWebhookResult = {
  tracking_no: string;
  status: string;
  event_type: string;
  raw: unknown;
};

export type ShipmentVerifyParams = {
  headers: Record<string, string | string[] | undefined>;
  rawBody: string;
};

export interface ShippingGateway {
  readonly name: string;
  createShipment(params: ShipmentCreateParams): Promise<ShipmentCreateResult>;
  parseWebhook?(payload: unknown): ShipmentWebhookResult | null;
  verifyWebhook?(params: ShipmentVerifyParams): boolean;
}
