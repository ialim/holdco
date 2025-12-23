import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { ShipmentCreateParams, ShipmentCreateResult, ShipmentWebhookResult, ShippingGateway } from "./shipping-gateway";

@Injectable()
export class InternalLogisticsGateway implements ShippingGateway {
  readonly name = "alims";

  async createShipment(_params: ShipmentCreateParams): Promise<ShipmentCreateResult> {
    return {
      tracking_no: `ALIMS-${randomUUID()}`,
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
}
