import { Controller, Get, Header, UseGuards } from "@nestjs/common";
import { register } from "prom-client";
import { MetricsGuard } from "./metrics.guard";

@Controller("v1")
@UseGuards(MetricsGuard)
export class MetricsController {
  @Get("metrics")
  @Header("Content-Type", register.contentType)
  async getMetrics() {
    return register.metrics();
  }
}
