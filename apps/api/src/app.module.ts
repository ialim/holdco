import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { AuthModule } from "./auth/auth.module";
import { JwtAuthMiddleware } from "./auth/jwt-auth.middleware";
import { AdvisoryModule } from "./advisory/advisory.module";
import { AdaptersModule } from "./adapters/adapters.module";
import { AuditModule } from "./audit/audit.module";
import { CatalogModule } from "./catalog/catalog.module";
import { ComplianceModule } from "./compliance/compliance.module";
import { CreditModule } from "./credit/credit.module";
import { EventsModule } from "./events/events.module";
import { FinanceModule } from "./finance/finance.module";
import { HealthModule } from "./health/health.module";
import { HrModule } from "./hr/hr.module";
import { MetricsModule } from "./metrics/metrics.module";
import { InventoryModule } from "./inventory/inventory.module";
import { LogisticsModule } from "./logistics/logistics.module";
import { LoyaltyModule } from "./loyalty/loyalty.module";
import { OrdersModule } from "./orders/orders.module";
import { PaymentsModule } from "./payments/payments.module";
import { PosModule } from "./pos/pos.module";
import { PricingModule } from "./pricing/pricing.module";
import { PrismaModule } from "./prisma/prisma.module";
import { ProcurementModule } from "./procurement/procurement.module";
import { ReportsModule } from "./reports/reports.module";
import { RolesModule } from "./roles/roles.module";
import { SharedServicesModule } from "./shared-services/shared-services.module";
import { TenancyModule } from "./tenancy/tenancy.module";

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    EventsModule,
    HealthModule,
    MetricsModule,
    FinanceModule,
    SharedServicesModule,
    RolesModule,
    TenancyModule,
    CatalogModule,
    InventoryModule,
    PricingModule,
    OrdersModule,
    PaymentsModule,
    PosModule,
    CreditModule,
    LoyaltyModule,
    LogisticsModule,
    ReportsModule,
    HrModule,
    ComplianceModule,
    ProcurementModule,
    AdvisoryModule,
    AdaptersModule,
    AuditModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtAuthMiddleware).forRoutes("*");
  }
}
