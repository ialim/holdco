---
name: event-outbox-design
description: Event schema, outbox pattern, idempotency, and RabbitMQ topology
---
# Eventing and Outbox Design

This document defines the event schema, outbox workflow, idempotency strategy, and RabbitMQ topology for the unified HoldCo backend. It is a design target; implementation work is tracked separately.

## Goals
- Reliable event delivery for cross-module workflows and integrations.
- Exactly-once side effects at consumers via idempotency.
- Preserve tenant isolation and traceability across events.

## Outbox schema (Postgres)
The current Prisma schema already defines `EventOutbox` mapped to `event_outbox`.

Fields (existing):
- `id` (uuid): event id and message id.
- `group_id` (uuid): tenant group scope.
- `subsidiary_id` (uuid, nullable): tenant subsidiary scope.
- `aggregate_type` (text): entity type (order, payment_intent, stock_adjustment).
- `aggregate_id` (uuid): entity id.
- `event_type` (text): action name (created, updated, cancelled).
- `payload` (jsonb): event payload.
- `status` (text): `pending`, `published`, `failed`, `dead`.
- `available_at` (timestamptz): retry scheduling.
- `attempts` (int): retry count.
- `created_at` (timestamptz): event creation time.

Recommended indexes:
- `(status, available_at)` for efficient worker polling.
- `(aggregate_type, aggregate_id)` for tracing.

## Outbox write path (producer)
1) Execute domain write and create outbox row in the same DB transaction.
2) Commit transaction.
3) Background worker publishes pending rows.

This guarantees that events are only emitted for committed state.

## Publisher worker
Polling worker pattern:
- Fetch a batch of `pending` rows with `available_at <= now()`.
- Lock rows using `FOR UPDATE SKIP LOCKED` to avoid double publish.
- Publish to RabbitMQ with publisher confirms.
- On success: mark `status = 'published'`.
- On failure: increment `attempts`, set `available_at = now() + backoff`.

Backoff suggestion:
- `min(2^attempts * 5s, 15m)` with jitter.
- After a max attempts threshold (e.g., 10), set `status = 'dead'`.

## Idempotency
### Producer idempotency
- The outbox row is the single source of truth for event emission.
- When an API supports request idempotency, use an idempotency key at the request layer to avoid duplicate writes before the outbox is created.

### Consumer idempotency
Consumers must de-duplicate by `event_id`.
Recommended approach:
- Create a small inbox table: `event_inbox(consumer_name, event_id, processed_at)` with a unique constraint.
- Consumer inserts `(consumer_name, event_id)` before applying side effects; if insert fails, skip.

If a DB table is not desired, use Redis with a TTL, but DB is preferred for strict auditing.

### Message identifiers and headers
Publish with:
- `message_id = event_outbox.id`
- headers:
  - `x-event-id`
  - `x-aggregate-type`
  - `x-aggregate-id`
  - `x-group-id`
  - `x-subsidiary-id`
  - `x-event-type`
  - `x-attempts`

## RabbitMQ topology
Exchange:
- `holdco.events` (topic)

Routing key format:
- `<aggregate_type>.<event_type>`
  - Examples: `order.created`, `payment_intent.captured`, `stock_adjustment.posted`

Queues (examples):
- `analytics.ingest` (binds to `#`)
- `erp.sync` (binds to `invoice.*`, `payment_intent.*`)
- `inventory.reconcile` (binds to `stock_*.*`)
- `pricing.refresh` (binds to `price_*.*`)
- `notifications` (binds to `order.*`, `payment_intent.failed`)

Dead-lettering:
- Each queue has a DLX `holdco.events.dlx` (direct).
- Dead-letter routing key: `<queue>.dlq`.
- DLQ queues: `analytics.ingest.dlq`, `erp.sync.dlq`, etc.

## Event payload shape
Standard envelope:
```
{
  "event_id": "uuid",
  "occurred_at": "2025-12-21T22:30:00Z",
  "aggregate_type": "order",
  "aggregate_id": "uuid",
  "event_type": "created",
  "group_id": "uuid",
  "subsidiary_id": "uuid",
  "payload": {
    "order_no": "ORD-0001",
    "total_amount": "125000.00",
    "currency": "NGN"
  }
}
```

## Consumer wiring example (amqplib)
Minimal example showing idempotent handling and ack/nack flow. Assumes a PrismaService instance named `prisma`.
```
import { connect } from "amqplib";
import { EventInboxService } from "../events/event-inbox.service";
import { OrderEventsConsumer } from "../events/examples/order-events.consumer";

const connection = await connect(process.env.RABBITMQ_URL ?? "");
const channel = await connection.createChannel();
await channel.assertQueue("orders.consumer", { durable: true });
await channel.bindQueue("orders.consumer", "holdco.events", "order.*");
channel.prefetch(10);

const inbox = new EventInboxService(prisma);
const consumer = new OrderEventsConsumer(inbox);

await channel.consume("orders.consumer", async (message) => {
  const ok = await consumer.handleMessage(message);
  if (!message) return;
  if (ok) {
    channel.ack(message);
  } else {
    channel.nack(message, false, true);
  }
});
```

## Operational notes
- Metrics: publish latency, attempts, dead-letter count, and consumer lag.
- Retention: archive `published` rows older than 30-90 days.
- Replays: build a replay tool that re-queues by `aggregate_type` and date range.

## Metrics endpoint
- `GET /v1/metrics` exposes Prometheus metrics.
- Set `METRICS_TOKEN` and pass it via `x-metrics-token` or `Authorization: Bearer <token>`.

## Implementation tasks
- [x] Add DB indexes for `event_outbox`: `(status, available_at)` and `(aggregate_type, aggregate_id)`.
- [x] Add `event_inbox` table + Prisma model with `consumer_name`, `event_id`, `processed_at`; enforce unique `(consumer_name, event_id)`.
- [x] Implement outbox publisher worker (poll + `FOR UPDATE SKIP LOCKED`, batch size, retry/backoff).
- [x] Enable RabbitMQ publisher confirms; mark rows `published` only after ack, otherwise increment attempts and reschedule.
- [x] Add consumer-side idempotency helper that inserts into `event_inbox` before side effects.
- [x] Add configuration knobs: batch size, poll interval, max attempts, backoff base/max.
- [x] Add outbox publisher status to `/v1/health`.
- [x] Add metrics/logging for publish latency, attempts, and dead-letter counts; expose `/v1/metrics`.
