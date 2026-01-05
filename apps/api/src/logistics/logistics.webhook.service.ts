import { BadRequestException, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { LogisticsGatewayFactory } from "./logistics-gateway.factory";
import { ShipmentWebhookResult, ShipmentVerifyParams } from "./gateways/shipping-gateway";

@Injectable()
export class LogisticsWebhookService {
  private readonly logger = new Logger(LogisticsWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gatewayFactory: LogisticsGatewayFactory,
  ) {}

  async handleWebhook(params: {
    carrier: string;
    headers: Record<string, string | string[] | undefined>;
    payload: unknown;
    rawBody: string;
  }) {
    const gateway = this.gatewayFactory.get(params.carrier);

    if (!gateway.verifyWebhook) {
      throw new UnauthorizedException("Webhook signature verification is required");
    }
    const ok = gateway.verifyWebhook(this.buildVerifyParams(params.headers, params.rawBody));
    if (!ok) throw new UnauthorizedException("Invalid webhook signature");

    if (!gateway.parseWebhook) {
      throw new BadRequestException("Unsupported carrier webhook");
    }

    const event = gateway.parseWebhook(params.payload);
    if (!event) return { status: "ignored" };

    const updated = await this.applyWebhook(event, gateway.name);
    return { status: "ok", updated };
  }

  private async applyWebhook(event: ShipmentWebhookResult, carrier: string) {
    const shipment = await this.prisma.shipment.findFirst({
      where: { trackingNo: event.tracking_no, carrier },
    });

    if (!shipment) {
      this.logger.warn(`Shipment not found for ${carrier}:${event.tracking_no}`);
      return false;
    }

    await this.prisma.shipment.update({
      where: { id: shipment.id },
      data: { status: event.status },
    });

    return true;
  }

  private buildVerifyParams(headers: Record<string, string | string[] | undefined>, rawBody: string): ShipmentVerifyParams {
    return { headers, rawBody };
  }
}
