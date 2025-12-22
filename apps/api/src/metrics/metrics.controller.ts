import { Controller, Get, Header } from "@nestjs/common";
import { register } from "prom-client";

@Controller("v1")
export class MetricsController {
  @Get("metrics")
  @Header("Content-Type", register.contentType)
  async getMetrics() {
    return register.metrics();
  }
}
