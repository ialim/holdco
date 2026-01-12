-- AlterTable
ALTER TABLE "orders" ADD COLUMN "paid_amount" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "orders" ADD COLUMN "payment_status" TEXT NOT NULL DEFAULT 'unpaid';

-- CreateTable
CREATE TABLE "order_payments" (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  subsidiary_id uuid not null references subsidiaries(id),
  order_id uuid not null references orders(id),
  payment_intent_id uuid references payment_intents(id),
  method text not null,
  payment_type text not null default 'full',
  amount numeric(12, 2) not null,
  currency text not null,
  status text not null default 'captured',
  provider text,
  reference text,
  points_redeemed integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- CreateIndex
CREATE INDEX "order_payments_order_id_idx" ON "order_payments"("order_id");

-- CreateIndex
CREATE INDEX "order_payments_payment_intent_id_idx" ON "order_payments"("payment_intent_id");
