-- AlterTable
ALTER TABLE "repayments" ADD COLUMN "unapplied_amount" NUMERIC(12, 2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "repayment_allocations" (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  subsidiary_id uuid not null references subsidiaries(id),
  repayment_id uuid not null references repayments(id),
  order_id uuid not null references orders(id),
  amount numeric(12, 2) not null,
  created_at timestamptz not null default now()
);

-- CreateIndex
CREATE INDEX "repayment_allocations_repayment_id_idx" ON "repayment_allocations"("repayment_id");

-- CreateIndex
CREATE INDEX "repayment_allocations_order_id_idx" ON "repayment_allocations"("order_id");
