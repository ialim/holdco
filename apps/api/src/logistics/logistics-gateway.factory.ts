import { Injectable } from "@nestjs/common";
import { GigGateway } from "./gateways/gig.gateway";
import { InternalLogisticsGateway } from "./gateways/internal-logistics.gateway";
import { KwikGateway } from "./gateways/kwik.gateway";
import { SendboxGateway } from "./gateways/sendbox.gateway";
import { ShipbubbleGateway } from "./gateways/shipbubble.gateway";
import { ShippingGateway } from "./gateways/shipping-gateway";

@Injectable()
export class LogisticsGatewayFactory {
  private readonly gateways: ShippingGateway[];

  constructor(
    private readonly shipbubble: ShipbubbleGateway,
    private readonly sendbox: SendboxGateway,
    private readonly gig: GigGateway,
    private readonly kwik: KwikGateway,
    private readonly internal: InternalLogisticsGateway,
  ) {
    this.gateways = [shipbubble, sendbox, gig, kwik, internal];
  }

  get(carrier: string): ShippingGateway {
    const normalized = carrier?.toLowerCase();
    return this.gateways.find((gateway) => gateway.name === normalized) ?? this.internal;
  }
}
