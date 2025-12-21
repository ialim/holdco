-- CreateTable
CREATE TABLE "event_inbox" (
    "id" UUID NOT NULL,
    "consumer_name" TEXT NOT NULL,
    "event_id" UUID NOT NULL,
    "processed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_inbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "event_inbox_event_id_idx" ON "event_inbox"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_inbox_consumer_name_event_id_key" ON "event_inbox"("consumer_name", "event_id");

-- CreateIndex
CREATE INDEX "event_outbox_status_available_at_idx" ON "event_outbox"("status", "available_at");

-- CreateIndex
CREATE INDEX "event_outbox_aggregate_type_aggregate_id_idx" ON "event_outbox"("aggregate_type", "aggregate_id");
