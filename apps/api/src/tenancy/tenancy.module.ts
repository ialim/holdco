import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { RolesModule } from "../roles/roles.module";
import { TenancyController } from "./tenancy.controller";
import { TenancyService } from "./tenancy.service";

@Module({
  imports: [PrismaModule, RolesModule],
  controllers: [TenancyController],
  providers: [TenancyService],
})
export class TenancyModule {}
