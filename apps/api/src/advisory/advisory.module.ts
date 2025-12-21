import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AdvisoryController } from "./advisory.controller";
import { AdvisoryService } from "./advisory.service";

@Module({
  imports: [PrismaModule],
  controllers: [AdvisoryController],
  providers: [AdvisoryService],
})
export class AdvisoryModule {}
