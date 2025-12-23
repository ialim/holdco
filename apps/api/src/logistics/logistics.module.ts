import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { LogisticsController } from "./logistics.controller";
import { LogisticsService } from "./logistics.service";
import { LogisticsWebhookController } from "./logistics.webhook.controller";
import { LogisticsWebhookService } from "./logistics.webhook.service";
import { LogisticsGatewayFactory } from "./logistics-gateway.factory";
import { ShipbubbleGateway } from "./gateways/shipbubble.gateway";
import { SendboxGateway } from "./gateways/sendbox.gateway";
import { GigGateway } from "./gateways/gig.gateway";
import { KwikGateway } from "./gateways/kwik.gateway";
import { InternalLogisticsGateway } from "./gateways/internal-logistics.gateway";

@Module({
  imports: [PrismaModule],
  controllers: [LogisticsController, LogisticsWebhookController],
  providers: [
    LogisticsService,
    LogisticsWebhookService,
    LogisticsGatewayFactory,
    ShipbubbleGateway,
    SendboxGateway,
    GigGateway,
    KwikGateway,
    InternalLogisticsGateway,
  ],
})
export class LogisticsModule {}
