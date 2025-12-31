import { Module } from "@nestjs/common";
import { OrdersModule } from "../orders/orders.module";
import { InventoryModule } from "../inventory/inventory.module";
import { PaymentsModule } from "../payments/payments.module";
import { LoyaltyModule } from "../loyalty/loyalty.module";
import { CreditModule } from "../credit/credit.module";
import { ProcurementModule } from "../procurement/procurement.module";
import { AuditModule } from "../audit/audit.module";
import { AdaptersController } from "./adapters.controller";
import { AdaptersService } from "./adapters.service";

@Module({
  imports: [OrdersModule, InventoryModule, PaymentsModule, LoyaltyModule, CreditModule, ProcurementModule, AuditModule],
  controllers: [AdaptersController],
  providers: [AdaptersService],
})
export class AdaptersModule {}
