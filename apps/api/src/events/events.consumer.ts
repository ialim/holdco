import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Channel, ChannelModel, ConsumeMessage, connect, Replies } from "amqplib";
import { EventInboxService } from "./event-inbox.service";
import { OrderEventsConsumer } from "./examples/order-events.consumer";

@Injectable()
export class EventsConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventsConsumerService.name);
  private connection?: ChannelModel;
  private channel?: Channel;
  private consumerTag?: string;

  private readonly enabled = (process.env.EVENTS_CONSUMERS_ENABLED ?? "false").toLowerCase() === "true";
  private readonly rabbitUrl = process.env.RABBITMQ_URL;
  private readonly exchange = process.env.EVENTS_EXCHANGE ?? "holdco.events";
  private readonly queueName = process.env.ORDER_EVENTS_QUEUE ?? "orders.consumer";
  private readonly routingKeys = (process.env.ORDER_EVENTS_ROUTING_KEYS ?? "order.*")
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean);
  private readonly prefetch = this.parseNumber(process.env.EVENTS_PREFETCH, 10);

  private readonly ordersConsumer: OrderEventsConsumer;

  constructor(private readonly inbox: EventInboxService) {
    this.ordersConsumer = new OrderEventsConsumer(inbox);
  }

  async onModuleInit() {
    if (!this.enabled) {
      this.logger.log("Event consumers disabled (EVENTS_CONSUMERS_ENABLED=false).");
      return;
    }
    if (!this.rabbitUrl) {
      this.logger.warn("Event consumers disabled (RABBITMQ_URL is not set).");
      return;
    }

    await this.ensureChannel();
    await this.startConsumer();
  }

  async onModuleDestroy() {
    try {
      if (this.channel && this.consumerTag) {
        await this.channel.cancel(this.consumerTag);
      }
    } catch (error) {
      this.logger.warn(`Failed to cancel consumer: ${(error as Error).message}`);
    }
    try {
      await this.channel?.close();
    } catch (error) {
      this.logger.warn(`Failed to close consumer channel: ${(error as Error).message}`);
    }
    try {
      await this.connection?.close();
    } catch (error) {
      this.logger.warn(`Failed to close consumer connection: ${(error as Error).message}`);
    }
  }

  private async ensureChannel() {
    if (this.channel) return;
    if (!this.rabbitUrl) return;

    try {
      const connection = await connect(this.rabbitUrl);
      this.connection = connection;
      connection.on("error", (error) => {
        this.logger.error(`RabbitMQ consumer connection error: ${error.message}`);
      });
      connection.on("close", () => {
        this.logger.warn("RabbitMQ consumer connection closed.");
        this.channel = undefined;
        this.connection = undefined;
      });

      const channel = await connection.createChannel();
      this.channel = channel;
      await channel.assertExchange(this.exchange, "topic", { durable: true });
      await channel.assertQueue(this.queueName, {
        durable: true,
        arguments: {
          "x-dead-letter-exchange": `${this.exchange}.dlx`,
          "x-dead-letter-routing-key": `${this.queueName}.dlq`,
        },
      });
      for (const key of this.routingKeys) {
        await channel.bindQueue(this.queueName, this.exchange, key);
      }
      await channel.prefetch(this.prefetch);
    } catch (error) {
      this.logger.error(`Failed to initialize consumer channel: ${(error as Error).message}`);
      this.channel = undefined;
      this.connection = undefined;
    }
  }

  private async startConsumer() {
    if (!this.channel) return;
    const reply = await this.channel.consume(this.queueName, async (message) => {
      await this.handleMessage(message);
    });
    this.consumerTag = reply.consumerTag;
    this.logger.log(
      `Order events consumer started on ${this.queueName} (${this.routingKeys.join(", ") || "no bindings"}).`,
    );
  }

  private async handleMessage(message: ConsumeMessage | null) {
    if (!this.channel || !message) return;

    try {
      const ok = await this.ordersConsumer.handleMessage(message);
      if (ok) {
        this.channel.ack(message);
      } else {
        this.channel.nack(message, false, false);
      }
    } catch (error) {
      this.logger.warn(`Consumer error: ${(error as Error).message}`);
      this.channel.nack(message, false, true);
    }
  }

  private parseNumber(value: string | undefined, fallback: number) {
    if (!value) return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
}
