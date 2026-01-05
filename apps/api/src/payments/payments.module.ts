import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AuditModule } from "../audit/audit.module";
import { PaymentsWebhookController } from "./payments.webhook.controller";
import { PaymentsReconciliationService } from "./payments.reconciliation.service";
import { PaymentGatewayFactory } from "./payment-gateway.factory";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { PaymentsWebhookService } from "./payments.webhook.service";
import { FlutterwaveGateway } from "./gateways/flutterwave.gateway";
import { InterswitchGateway } from "./gateways/interswitch.gateway";
import { ManualGateway } from "./gateways/manual.gateway";
import { MonnifyGateway } from "./gateways/monnify.gateway";
import { PaystackGateway } from "./gateways/paystack.gateway";

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [PaymentsController, PaymentsWebhookController],
  providers: [
    PaymentsService,
    PaymentsWebhookService,
    PaymentsReconciliationService,
    PaymentGatewayFactory,
    PaystackGateway,
    FlutterwaveGateway,
    MonnifyGateway,
    InterswitchGateway,
    ManualGateway,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
