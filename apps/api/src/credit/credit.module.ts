import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { PrismaModule } from "../prisma/prisma.module";
import { CreditController } from "./credit.controller";
import { CreditService } from "./credit.service";

@Module({
  imports: [AuditModule, PrismaModule],
  controllers: [CreditController],
  providers: [CreditService],
  exports: [CreditService],
})
export class CreditModule {}
