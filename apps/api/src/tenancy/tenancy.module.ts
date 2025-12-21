import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { TenancyController } from "./tenancy.controller";
import { TenancyService } from "./tenancy.service";

@Module({
  imports: [PrismaModule],
  controllers: [TenancyController],
  providers: [TenancyService],
})
export class TenancyModule {}
