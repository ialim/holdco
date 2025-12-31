import { Module } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { LedgerSetupController } from "./ledger-setup.controller";
import { LedgerSetupService } from "./ledger-setup.service";

@Module({
  controllers: [LedgerSetupController],
  providers: [LedgerSetupService, PrismaService],
})
export class LedgerSetupModule {}
