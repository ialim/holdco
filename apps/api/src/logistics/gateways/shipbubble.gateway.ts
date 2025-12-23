import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { ShipmentCreateParams, ShipmentCreateResult, ShipmentVerifyParams, ShipmentWebhookResult, ShippingGateway } from "./shipping-gateway";

@Injectable()
export class ShipbubbleGateway implements ShippingGateway {
  readonly name = "shipbubble";

  async createShipment(_params: ShipmentCreateParams): Promise<ShipmentCreateResult> {
    return {
      tracking_no: `SHPB-${randomUUID()}`,
      status: "created",
    };
  }

  parseWebhook(payload: unknown): ShipmentWebhookResult | null {
    const data = payload as Record<string, any>;
    const trackingNo = data?.tracking_no ?? data?.tracking_number ?? data?.trackingNumber;
    if (!trackingNo) return null;
    const status = data?.status ?? "in_transit";

    return {
      tracking_no: trackingNo,
      status,
      event_type: data?.event ?? "status.update",
      raw: payload,
    };
  }

  verifyWebhook(params: ShipmentVerifyParams): boolean {
    const token = process.env.SHIPBUBBLE_WEBHOOK_TOKEN;
    const signature = this.readHeader(params.headers["x-shipbubble-token"]);
    if (!token || !signature) return false;
    return signature === token;
  }

  private readHeader(value: string | string[] | undefined): string | undefined {
    if (!value) return undefined;
    return Array.isArray(value) ? value[0] : value;
  }
}
