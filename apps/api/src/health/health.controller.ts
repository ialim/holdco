import { Controller, Get } from "@nestjs/common";
import { OutboxPublisherService } from "../events/outbox.publisher";

@Controller("v1")
export class HealthController {
  constructor(private readonly outboxPublisher: OutboxPublisherService) {}

  @Get("health")
  getHealth() {
    const outbox = this.outboxPublisher.getStatus();
    const status = outbox.enabled && !outbox.connected ? "degraded" : "ok";

    return {
      status,
      time: new Date().toISOString(),
      outbox,
    };
  }
}
