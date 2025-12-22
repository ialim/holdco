import { Logger } from "@nestjs/common";
import { ConsumeMessage } from "amqplib";
import { EventInboxService } from "../event-inbox.service";

type EventEnvelope = {
  event_id?: string;
  event_type?: string;
  aggregate_type?: string;
  aggregate_id?: string;
  payload?: Record<string, unknown>;
};

export class OrderEventsConsumer {
  private readonly logger = new Logger(OrderEventsConsumer.name);
  private readonly consumerName = "orders.consumer";

  constructor(private readonly inbox: EventInboxService) {}

  async handleMessage(message: ConsumeMessage | null): Promise<boolean> {
    if (!message) return false;

    let envelope: EventEnvelope;
    try {
      envelope = JSON.parse(message.content.toString()) as EventEnvelope;
    } catch (error) {
      this.logger.warn(`Invalid JSON payload: ${(error as Error).message}`);
      return false;
    }

    const eventId = envelope.event_id ?? message.properties.messageId ?? undefined;
    if (!eventId) {
      this.logger.warn("Missing event_id for message; skipping.");
      return false;
    }

    const shouldProcess = await this.inbox.record(this.consumerName, eventId);
    if (!shouldProcess) {
      this.logger.debug(`Duplicate event ${eventId}; skipping.`);
      return true;
    }

    if (envelope.aggregate_type !== "order" || !envelope.event_type) {
      this.logger.debug(`Ignoring event type ${envelope.aggregate_type}.${envelope.event_type}`);
      return true;
    }

    switch (envelope.event_type) {
      case "created":
        this.logger.log(`Order created: ${envelope.aggregate_id}`);
        break;
      case "cancelled":
        this.logger.log(`Order cancelled: ${envelope.aggregate_id}`);
        break;
      default:
        this.logger.debug(`Unhandled order event: ${envelope.event_type}`);
    }

    return true;
  }
}
