-- CreateTable
CREATE TABLE "pos_devices" (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  subsidiary_id uuid not null references subsidiaries(id),
  location_id uuid not null references locations(id),
  device_id text not null,
  name text,
  status text not null default 'active',
  metadata jsonb,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, device_id)
);

-- CreateTable
CREATE TABLE "pos_shifts" (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  subsidiary_id uuid not null references subsidiaries(id),
  location_id uuid not null references locations(id),
  pos_device_id uuid not null references pos_devices(id),
  opened_by uuid references users(id),
  closed_by uuid references users(id),
  status text not null default 'open',
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  opening_float numeric(12, 2),
  closing_float numeric(12, 2),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- CreateIndex
CREATE INDEX "pos_devices_subsidiary_id_idx" ON "pos_devices"("subsidiary_id");

-- CreateIndex
CREATE INDEX "pos_devices_location_id_idx" ON "pos_devices"("location_id");

-- CreateIndex
CREATE INDEX "pos_shifts_subsidiary_id_idx" ON "pos_shifts"("subsidiary_id");

-- CreateIndex
CREATE INDEX "pos_shifts_location_id_idx" ON "pos_shifts"("location_id");

-- CreateIndex
CREATE INDEX "pos_shifts_pos_device_id_idx" ON "pos_shifts"("pos_device_id");
