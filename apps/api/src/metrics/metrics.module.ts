import { Module } from "@nestjs/common";
import { MetricsGuard } from "./metrics.guard";
import { MetricsController } from "./metrics.controller";

@Module({
  controllers: [MetricsController],
  providers: [MetricsGuard],
})
export class MetricsModule {}
