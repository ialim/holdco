-- CreateTable
CREATE TABLE "payment_provider_configs" (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  subsidiary_id uuid not null references subsidiaries(id),
  provider text not null,
  environment text not null default 'test',
  status text not null default 'draft',
  settlement_account_name text,
  settlement_account_number text,
  settlement_bank_name text,
  settlement_bank_code text,
  settlement_currency text,
  contact_name text,
  contact_email text,
  contact_phone text,
  provider_merchant_id text,
  kyc_submitted_at timestamptz,
  kyc_approved_at timestamptz,
  kyc_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subsidiary_id, provider, environment)
);

-- CreateIndex
CREATE INDEX "payment_provider_configs_group_id_idx" ON "payment_provider_configs"("group_id");
