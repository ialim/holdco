"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const auth_module_1 = require("./auth/auth.module");
const jwt_auth_middleware_1 = require("./auth/jwt-auth.middleware");
const advisory_module_1 = require("./advisory/advisory.module");
const catalog_module_1 = require("./catalog/catalog.module");
const compliance_module_1 = require("./compliance/compliance.module");
const credit_module_1 = require("./credit/credit.module");
const finance_module_1 = require("./finance/finance.module");
const hr_module_1 = require("./hr/hr.module");
const inventory_module_1 = require("./inventory/inventory.module");
const logistics_module_1 = require("./logistics/logistics.module");
const loyalty_module_1 = require("./loyalty/loyalty.module");
const orders_module_1 = require("./orders/orders.module");
const payments_module_1 = require("./payments/payments.module");
const pricing_module_1 = require("./pricing/pricing.module");
const prisma_module_1 = require("./prisma/prisma.module");
const procurement_module_1 = require("./procurement/procurement.module");
const reports_module_1 = require("./reports/reports.module");
const roles_module_1 = require("./roles/roles.module");
const shared_services_module_1 = require("./shared-services/shared-services.module");
const tenancy_module_1 = require("./tenancy/tenancy.module");
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(jwt_auth_middleware_1.JwtAuthMiddleware).forRoutes("*");
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            auth_module_1.AuthModule,
            prisma_module_1.PrismaModule,
            finance_module_1.FinanceModule,
            shared_services_module_1.SharedServicesModule,
            roles_module_1.RolesModule,
            tenancy_module_1.TenancyModule,
            catalog_module_1.CatalogModule,
            inventory_module_1.InventoryModule,
            pricing_module_1.PricingModule,
            orders_module_1.OrdersModule,
            payments_module_1.PaymentsModule,
            credit_module_1.CreditModule,
            loyalty_module_1.LoyaltyModule,
            logistics_module_1.LogisticsModule,
            reports_module_1.ReportsModule,
            hr_module_1.HrModule,
            compliance_module_1.ComplianceModule,
            procurement_module_1.ProcurementModule,
            advisory_module_1.AdvisoryModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map