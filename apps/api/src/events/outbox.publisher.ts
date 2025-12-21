import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { EventOutbox } from "@prisma/client";
import { ChannelModel, ConfirmChannel, connect } from "amqplib";
import { PrismaService } from "../prisma/prisma.service";

type OutboxRow = EventOutbox;

@Injectable()
export class OutboxPublisherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxPublisherService.name);
  private connection?: ChannelModel;
  private channel?: ConfirmChannel;
  private timer?: NodeJS.Timeout;
  private running = false;

  private readonly exchange = process.env.EVENTS_EXCHANGE ?? "holdco.events";
  private readonly rabbitUrl = process.env.RABBITMQ_URL;
  private readonly enabled = (process.env.OUTBOX_PUBLISHER_ENABLED ?? "false").toLowerCase() === "true";
  private readonly pollIntervalMs = this.parseNumber(process.env.OUTBOX_POLL_INTERVAL_MS, 2000);
  private readonly batchSize = this.parseNumber(process.env.OUTBOX_BATCH_SIZE, 50);
  private readonly maxAttempts = this.parseNumber(process.env.OUTBOX_MAX_ATTEMPTS, 10);
  private readonly backoffBaseSeconds = this.parseNumber(process.env.OUTBOX_BACKOFF_BASE_SECONDS, 5);
  private readonly backoffMaxSeconds = this.parseNumber(process.env.OUTBOX_BACKOFF_MAX_SECONDS, 900);
  private readonly lockTimeoutSeconds = this.parseNumber(process.env.OUTBOX_LOCK_TIMEOUT_SECONDS, 300);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    if (!this.enabled) {
      this.logger.log("Outbox publisher disabled (OUTBOX_PUBLISHER_ENABLED=false).");
      return;
    }
    if (!this.rabbitUrl) {
      this.logger.warn("Outbox publisher disabled (RABBITMQ_URL is not set).");
      return;
    }

    await this.ensureChannel();
    this.timer = setInterval(() => {
      void this.tick();
    }, this.pollIntervalMs);
    await this.tick();
  }

  async onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
    try {
      await this.channel?.close();
    } catch (error) {
      this.logger.warn(`Failed to close outbox channel: ${(error as Error).message}`);
    }
    try {
      await this.connection?.close();
    } catch (error) {
      this.logger.warn(`Failed to close outbox connection: ${(error as Error).message}`);
    }
  }

  private async tick() {
    if (this.running) return;
    this.running = true;
    try {
      await this.ensureChannel();
      if (!this.channel) return;

      const rows = await this.claimPending();
      for (const row of rows) {
        await this.publishRow(row);
      }
    } catch (error) {
      this.logger.error(`Outbox tick failed: ${(error as Error).message}`);
    } finally {
      this.running = false;
    }
  }

  private async ensureChannel() {
    if (this.channel) return;
    if (!this.rabbitUrl) return;

    try {
      const connection = await connect(this.rabbitUrl);
      this.connection = connection;
      connection.on("error", (error) => {
        this.logger.error(`RabbitMQ connection error: ${error.message}`);
      });
      connection.on("close", () => {
        this.logger.warn("RabbitMQ connection closed.");
        this.channel = undefined;
        this.connection = undefined;
      });

      const channel = await connection.createConfirmChannel();
      this.channel = channel;
      await channel.assertExchange(this.exchange, "topic", { durable: true });
    } catch (error) {
      this.logger.error(`Failed to connect to RabbitMQ: ${(error as Error).message}`);
      this.channel = undefined;
      this.connection = undefined;
    }
  }

  private async claimPending(): Promise<OutboxRow[]> {
    const batchSize = Math.max(1, this.batchSize);
    const lockSeconds = Math.max(1, this.lockTimeoutSeconds);

    return this.prisma.$queryRaw<OutboxRow[]>`
      with cte as (
        select id
        from event_outbox
        where status in ('pending', 'failed')
          and available_at <= now()
        order by created_at
        limit ${batchSize}
        for update skip locked
      )
      update event_outbox e
      set available_at = now() + (${lockSeconds} * interval '1 second')
      from cte
      where e.id = cte.id
      returning e.*;
    `;
  }

  private async publishRow(row: OutboxRow) {
    if (!this.channel) return;

    const routingKey = `${row.aggregateType}.${row.eventType}`;
    const envelope = {
      event_id: row.id,
      occurred_at: row.createdAt.toISOString(),
      aggregate_type: row.aggregateType,
      aggregate_id: row.aggregateId,
      event_type: row.eventType,
      group_id: row.groupId,
      subsidiary_id: row.subsidiaryId,
      payload: row.payload,
    };

    try {
      await this.publishWithConfirm(routingKey, envelope, row);
      await this.prisma.eventOutbox.update({
        where: { id: row.id },
        data: { status: "published" },
      });
    } catch (error) {
      const attempts = row.attempts + 1;
      const status = attempts >= this.maxAttempts ? "dead" : "failed";
      const backoffSeconds = this.getBackoffSeconds(attempts);

      await this.prisma.eventOutbox.update({
        where: { id: row.id },
        data: {
          status,
          attempts,
          availableAt: new Date(Date.now() + backoffSeconds * 1000),
        },
      });

      this.logger.warn(`Publish failed for ${row.id}: ${(error as Error).message}`);
    }
  }

  private publishWithConfirm(routingKey: string, payload: object, row: OutboxRow): Promise<void> {
    if (!this.channel) return Promise.resolve();

    return new Promise((resolve, reject) => {
      this.channel!.publish(
        this.exchange,
        routingKey,
        Buffer.from(JSON.stringify(payload)),
        {
          messageId: row.id,
          contentType: "application/json",
          persistent: true,
          headers: {
            "x-event-id": row.id,
            "x-aggregate-type": row.aggregateType,
            "x-aggregate-id": row.aggregateId,
            "x-group-id": row.groupId,
            "x-subsidiary-id": row.subsidiaryId ?? "",
            "x-event-type": row.eventType,
            "x-attempts": row.attempts,
          },
        },
        (error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve();
        },
      );
    });
  }

  private getBackoffSeconds(attempts: number) {
    const exponent = Math.max(0, attempts - 1);
    const backoff = this.backoffBaseSeconds * Math.pow(2, exponent);
    return Math.min(this.backoffMaxSeconds, backoff);
  }

  private parseNumber(value: string | undefined, fallback: number) {
    if (!value) return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
}
