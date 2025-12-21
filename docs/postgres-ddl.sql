-- HoldCo Unified Backend - Postgres DDL (logical)
-- This schema is a starting point; adjust constraints and indexes per workload.

create extension if not exists pgcrypto;

-- Tenancy and access
create table if not exists tenant_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists subsidiaries (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  name text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, name)
);

create table if not exists locations (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  subsidiary_id uuid not null references subsidiaries(id),
  type text not null,
  name text not null,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  country text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  email text not null,
  name text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, email)
);

create table if not exists roles (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  name text not null,
  scope text not null,
  created_at timestamptz not null default now(),
  unique (group_id, name)
);

create table if not exists permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text
);

create table if not exists user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  role_id uuid not null references roles(id),
  subsidiary_id uuid references subsidiaries(id),
  location_id uuid references locations(id),
  created_at timestamptz not null default now()
);

create table if not exists role_permissions (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references roles(id),
  permission_id uuid not null references permissions(id),
  created_at timestamptz not null default now(),
  unique (role_id, permission_id)
);

-- Catalog
create table if not exists brands (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  name text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, name)
);

create table if not exists suppliers (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  name text not null,
  contact_name text,
  contact_phone text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, name)
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  subsidiary_id uuid references subsidiaries(id),
  brand_id uuid references brands(id),
  supplier_id uuid references suppliers(id),
  sku text not null,
  name text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, sku)
);

create table if not exists variants (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  subsidiary_id uuid references subsidiaries(id),
  product_id uuid not null references products(id),
  size text,
  unit text,
  barcode text,
  created_at timestamptz not null default now(),
  unique (group_id, barcode)
);

create table if not exists batches (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  subsidiary_id uuid references subsidiaries(id),
  product_id uuid not null references products(id),
  code text not null,
  expires_at date,
  created_at timestamptz not null default now()
);

create table if not exists lots (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  subsidiary_id uuid references subsidiaries(id),
  batch_id uuid not null references batches(id),
  quantity integer not null,
  created_at timestamptz not null default now()
);

-- Inventory
create table if not exists stock_levels (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  subsidiary_id uuid not null references subsidiaries(id),
  location_id uuid not null references locations(id),
  product_id uuid not null references products(id),
  variant_id uuid references variants(id),
  on_hand integer not null default 0,
  reserved integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (group_id, subsidiary_id, location_id, product_id, variant_id)
);

create table if not exists stock_adjustments (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  subsidiary_id uuid not null references subsidiaries(id),
  location_id uuid not null references locations(id),
  product_id uuid not null references products(id),
  variant_id uuid references variants(id),
  quantity integer not null,
  reason text not null,
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

create table if not exists stock_transfers (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  subsidiary_id uuid not null references subsidiaries(id),
  from_location_id uuid not null references locations(id),
  to_location_id uuid not null references locations(id),
  product_id uuid not null references products(id),
  variant_id uuid references variants(id),
  quantity integer not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists stock_reservations (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  subsidiary_id uuid not null references subsidiaries(id),
  location_id uuid not null references locations(id),
  order_id uuid,
  product_id uuid not null references products(id),
  variant_id uuid references variants(id),
  quantity integer not null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

-- Pricing and promotions
create table if not exists price_lists (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  subsidiary_id uuid references subsidiaries(id),
  name text not null,
  currency text not null,
  channel text,
  valid_from date,
  valid_to date,
  created_at timestamptz not null default now()
);

create table if not exists price_rules (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  subsidiary_id uuid references subsidiaries(id),
  price_list_id uuid not null references price_lists(id),
  product_id uuid not null references products(id),
  variant_id uuid references variants(id),
  min_qty integer not null default 1,
  price numeric(12, 2) not null,
  created_at timestamptz not null default now()
);

create table if not exists promotions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  subsidiary_id uuid references subsidiaries(id),
  code text not null,
  type text not null,
  value numeric(12, 2) not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  unique (group_id, code)
);

-- Orders and payments
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  subsidiary_id uuid references subsidiaries(id),
  name text not null,
  email text,
  phone text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists resellers (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  subsidiary_id uuid not null references subsidiaries(id),
  name text not null,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists carts (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  subsidiary_id uuid not null references subsidiaries(id),
  customer_id uuid references customers(id),
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references carts(id) on delete cascade,
  product_id uuid not null references products(id),
  variant_id uuid references variants(id),
  quantity integer not null,
  unit_price numeric(12, 2) not null,
  created_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  subsidiary_id uuid not null references subsidiaries(id),
  location_id uuid references locations(id),
  channel text,
  order_no text not null,
  customer_id uuid references customers(id),
  reseller_id uuid references resellers(id),
  status text not null default 'pending',
  total_amount numeric(12, 2) not null,
  currency text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, order_no)
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id),
  variant_id uuid references variants(id),
  quantity integer not null,
  unit_price numeric(12, 2) not null,
  total_price numeric(12, 2) not null
);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id),
  invoice_type text not null default 'EXTERNAL',
  status text not null default 'pending',
  seller_company_id uuid not null references subsidiaries(id),
  buyer_company_id uuid not null references subsidiaries(id),
  period text not null,
  issue_date timestamptz not null,
  due_date timestamptz not null,
  subtotal numeric(12, 2) not null,
  vat_amount numeric(12, 2) not null,
  total_amount numeric(12, 2) not null,
  is_credit_note boolean not null default false,
  related_invoice_id uuid references invoices(id),
  created_at timestamptz not null default now()
);

create table if not exists payment_intents (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  subsidiary_id uuid not null references subsidiaries(id),
  order_id uuid not null references orders(id),
  amount numeric(12, 2) not null,
  currency text not null,
  status text not null,
  provider text,
  reference text,
  created_at timestamptz not null default now()
);

create table if not exists refunds (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  subsidiary_id uuid not null references subsidiaries(id),
  payment_intent_id uuid not null references payment_intents(id),
  amount numeric(12, 2) not null,
  reason text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists returns (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  subsidiary_id uuid not null references subsidiaries(id),
  order_id uuid not null references orders(id),
  status text not null default 'pending',
  reason text,
  created_at timestamptz not null default now()
);

-- Credit and collections
create table if not exists credit_accounts (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  subsidiary_id uuid not null references subsidiaries(id),
  reseller_id uuid not null references resellers(id),
  limit_amount numeric(12, 2) not null,
  used_amount numeric(12, 2) not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists payment_schedules (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  subsidiary_id uuid not null references subsidiaries(id),
  credit_account_id uuid not null references credit_accounts(id),
  due_date date not null,
  amount numeric(12, 2) not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists repayments (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  subsidiary_id uuid not null references subsidiaries(id),
  credit_account_id uuid not null references credit_accounts(id),
  amount numeric(12, 2) not null,
  paid_at timestamptz not null default now(),
  method text,
  created_at timestamptz not null default now()
);

-- Loyalty
create table if not exists loyalty_accounts (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  subsidiary_id uuid not null references subsidiaries(id),
  customer_id uuid not null references customers(id),
  points_balance integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (customer_id)
);

create table if not exists points_ledger (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  subsidiary_id uuid not null references subsidiaries(id),
  loyalty_account_id uuid not null references loyalty_accounts(id),
  points integer not null,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  subsidiary_id uuid references subsidiaries(id),
  name text not null,
  start_at timestamptz,
  end_at timestamptz,
  status text not null default 'active'
);

-- Logistics
create table if not exists shipments (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  subsidiary_id uuid not null references subsidiaries(id),
  order_id uuid not null references orders(id),
  carrier text not null,
  status text not null default 'created',
  tracking_no text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists delivery_slots (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  subsidiary_id uuid not null references subsidiaries(id),
  shipment_id uuid not null references shipments(id),
  start_at timestamptz not null,
  end_at timestamptz not null
);

create table if not exists proofs_of_delivery (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  subsidiary_id uuid not null references subsidiaries(id),
  shipment_id uuid not null references shipments(id),
  signed_by text,
  received_at timestamptz
);

-- Reporting and audit
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  subsidiary_id uuid references subsidiaries(id),
  actor_id uuid references users(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  payload jsonb,
  created_at timestamptz not null default now()
);

create table if not exists event_outbox (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  subsidiary_id uuid references subsidiaries(id),
  aggregate_type text not null,
  aggregate_id uuid not null,
  event_type text not null,
  payload jsonb not null,
  status text not null default 'pending',
  available_at timestamptz not null default now(),
  attempts integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists event_outbox_status_available_at_idx on event_outbox (status, available_at);
create index if not exists event_outbox_aggregate_idx on event_outbox (aggregate_type, aggregate_id);

create table if not exists event_inbox (
  id uuid primary key default gen_random_uuid(),
  consumer_name text not null,
  event_id uuid not null,
  processed_at timestamptz not null default now(),
  unique (consumer_name, event_id)
);

create index if not exists event_inbox_event_id_idx on event_inbox (event_id);

create table if not exists external_systems (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists external_id_maps (
  id uuid primary key default gen_random_uuid(),
  external_system_id uuid not null references external_systems(id),
  entity_type text not null,
  entity_id uuid not null,
  external_id text not null,
  created_at timestamptz not null default now(),
  unique (external_system_id, entity_type, external_id)
);

-- Shared services (holding company)
create table if not exists external_clients (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  name text not null,
  type text not null,
  email text,
  phone text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, name, type)
);

create table if not exists service_requests (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  subsidiary_id uuid references subsidiaries(id),
  external_client_id uuid references external_clients(id),
  category text not null,
  title text not null,
  description text,
  status text not null default 'open',
  priority text not null default 'normal',
  assigned_to uuid references users(id),
  approved_by uuid references users(id),
  approved_at timestamptz,
  rejected_by uuid references users(id),
  rejected_at timestamptz,
  reason text,
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists service_tasks (
  id uuid primary key default gen_random_uuid(),
  service_request_id uuid not null references service_requests(id) on delete cascade,
  title text not null,
  status text not null default 'open',
  assigned_to uuid references users(id),
  due_at timestamptz,
  created_at timestamptz not null default now()
);

-- Human resources
create table if not exists departments (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  subsidiary_id uuid references subsidiaries(id),
  code text,
  name text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, code)
);

create table if not exists positions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  subsidiary_id uuid references subsidiaries(id),
  title text not null,
  level text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists employees (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  subsidiary_id uuid not null references subsidiaries(id),
  user_id uuid references users(id),
  department_id uuid references departments(id),
  position_id uuid references positions(id),
  employee_no text not null,
  status text not null default 'active',
  hired_at date,
  terminated_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (group_id, employee_no)
);

create table if not exists leave_requests (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  subsidiary_id uuid not null references subsidiaries(id),
  employee_id uuid not null references employees(id),
  type text not null,
  start_date date not null,
  end_date date not null,
  status text not null default 'pending',
  reason text,
  created_at timestamptz not null default now()
);

-- Finance and accounting
create table if not exists cost_centers (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  subsidiary_id uuid references subsidiaries(id),
  code text not null,
  name text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  unique (group_id, code)
);

create table if not exists chart_of_accounts (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  code text not null,
  name text not null,
  type text not null,
  parent_id uuid references chart_of_accounts(id),
  created_at timestamptz not null default now(),
  unique (group_id, code)
);

create table if not exists fiscal_periods (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  name text not null,
  start_date date not null,
  end_date date not null,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists journal_entries (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  subsidiary_id uuid references subsidiaries(id),
  fiscal_period_id uuid not null references fiscal_periods(id),
  reference text,
  memo text,
  status text not null default 'draft',
  posted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists journal_lines (
  id uuid primary key default gen_random_uuid(),
  journal_entry_id uuid not null references journal_entries(id) on delete cascade,
  account_id uuid not null references chart_of_accounts(id),
  cost_center_id uuid references cost_centers(id),
  description text,
  debit numeric(12, 2) not null default 0,
  credit numeric(12, 2) not null default 0
);

create table if not exists ledger_accounts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references subsidiaries(id),
  code text not null,
  name text,
  type text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, code)
);

create table if not exists ledger_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references subsidiaries(id),
  period text not null,
  entry_date timestamptz not null,
  account_id uuid not null references ledger_accounts(id),
  debit numeric(12, 2) not null,
  credit numeric(12, 2) not null,
  memo text,
  source_type text not null,
  source_ref text not null,
  created_at timestamptz not null default now()
);

create table if not exists cost_pools (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references subsidiaries(id),
  period text not null,
  total_cost numeric(12, 2) not null,
  created_at timestamptz not null default now(),
  unique (company_id, period)
);

create table if not exists cost_pool_lines (
  id uuid primary key default gen_random_uuid(),
  cost_pool_id uuid not null references cost_pools(id) on delete cascade,
  category text not null,
  amount numeric(12, 2) not null,
  created_at timestamptz not null default now()
);

create table if not exists allocation_rules (
  id uuid primary key default gen_random_uuid(),
  cost_pool_id uuid not null references cost_pools(id) on delete cascade,
  method text not null,
  created_at timestamptz not null default now(),
  unique (cost_pool_id)
);

create table if not exists allocation_weights (
  id uuid primary key default gen_random_uuid(),
  allocation_rule_id uuid not null references allocation_rules(id) on delete cascade,
  recipient_company_id uuid not null references subsidiaries(id),
  weight numeric(8, 6) not null,
  created_at timestamptz not null default now(),
  unique (allocation_rule_id, recipient_company_id)
);

create table if not exists cost_allocations (
  id uuid primary key default gen_random_uuid(),
  cost_pool_id uuid not null references cost_pools(id) on delete cascade,
  recipient_company_id uuid not null references subsidiaries(id),
  allocated_cost numeric(12, 2) not null,
  created_at timestamptz not null default now(),
  unique (cost_pool_id, recipient_company_id)
);

create table if not exists intercompany_agreements (
  id uuid primary key default gen_random_uuid(),
  provider_company_id uuid not null references subsidiaries(id),
  recipient_company_id uuid not null references subsidiaries(id),
  type text not null,
  pricing_model text not null,
  markup_rate numeric(8, 4),
  fixed_fee_amount numeric(12, 2),
  vat_applies boolean not null default false,
  vat_rate numeric(8, 4) not null,
  wht_applies boolean not null default false,
  wht_rate numeric(8, 4) not null,
  wht_tax_type text,
  effective_from timestamptz not null,
  effective_to timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists invoice_lines (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  agreement_id uuid references intercompany_agreements(id),
  description text not null,
  net_amount numeric(12, 2) not null,
  vat_rate numeric(8, 4) not null,
  vat_amount numeric(12, 2) not null,
  wht_rate numeric(8, 4) not null,
  wht_amount numeric(12, 2) not null,
  gross_amount numeric(12, 2) not null,
  created_at timestamptz not null default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id),
  payer_company_id uuid not null references subsidiaries(id),
  payee_company_id uuid not null references subsidiaries(id),
  payment_date timestamptz not null,
  amount_paid numeric(12, 2) not null,
  wht_withheld_amount numeric(12, 2) not null,
  reference text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists wht_credit_notes (
  id uuid primary key default gen_random_uuid(),
  period text not null,
  issuer_company_id uuid not null references subsidiaries(id),
  beneficiary_company_id uuid not null references subsidiaries(id),
  tax_type text not null,
  amount numeric(12, 2) not null,
  remittance_date timestamptz,
  fir_receipt_ref text,
  created_at timestamptz not null default now()
);

create table if not exists vat_returns (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references subsidiaries(id),
  period text not null,
  output_vat numeric(12, 2) not null,
  input_vat numeric(12, 2) not null,
  net_vat_payable numeric(12, 2) not null,
  status text not null default 'DRAFT',
  filed_at timestamptz,
  payment_ref text,
  created_at timestamptz not null default now(),
  unique (company_id, period)
);

create table if not exists period_locks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references subsidiaries(id),
  period text not null,
  locked boolean not null default false,
  locked_at timestamptz,
  locked_by text,
  reason text,
  created_at timestamptz not null default now(),
  unique (company_id, period)
);

-- Compliance and risk
create table if not exists compliance_policies (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  title text not null,
  version text,
  status text not null default 'active',
  effective_at date,
  review_at date,
  owner_id uuid references users(id),
  created_at timestamptz not null default now()
);

create table if not exists compliance_tasks (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  subsidiary_id uuid references subsidiaries(id),
  policy_id uuid references compliance_policies(id),
  title text not null,
  status text not null default 'open',
  due_at timestamptz,
  assignee_id uuid references users(id),
  created_at timestamptz not null default now()
);

create table if not exists risk_register_items (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  subsidiary_id uuid references subsidiaries(id),
  title text not null,
  category text,
  likelihood integer,
  impact integer,
  score integer,
  status text not null default 'open',
  owner_id uuid references users(id),
  mitigation text,
  created_at timestamptz not null default now()
);

create table if not exists compliance_audits (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  subsidiary_id uuid references subsidiaries(id),
  title text not null,
  scope text,
  status text not null default 'planned',
  started_at date,
  completed_at date,
  lead_auditor_id uuid references users(id),
  created_at timestamptz not null default now()
);

create table if not exists audit_findings (
  id uuid primary key default gen_random_uuid(),
  compliance_audit_id uuid not null references compliance_audits(id) on delete cascade,
  severity text not null,
  description text not null,
  status text not null default 'open',
  remediation_due_at date,
  assignee_id uuid references users(id),
  created_at timestamptz not null default now()
);

-- Procurement coordination
create table if not exists purchase_requests (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  subsidiary_id uuid not null references subsidiaries(id),
  requester_id uuid references users(id),
  status text not null default 'pending',
  requested_at timestamptz not null default now(),
  needed_by date,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists purchase_request_items (
  id uuid primary key default gen_random_uuid(),
  purchase_request_id uuid not null references purchase_requests(id) on delete cascade,
  description text not null,
  quantity integer not null,
  unit text,
  estimated_unit_cost numeric(12, 2)
);

create table if not exists purchase_orders (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  subsidiary_id uuid not null references subsidiaries(id),
  vendor_id uuid references external_clients(id),
  status text not null default 'draft',
  ordered_at timestamptz,
  expected_at date,
  total_amount numeric(12, 2),
  currency text,
  created_at timestamptz not null default now()
);

create table if not exists purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null references purchase_orders(id) on delete cascade,
  description text not null,
  quantity integer not null,
  unit_price numeric(12, 2) not null,
  total_price numeric(12, 2) not null
);

-- Business advisory
create table if not exists advisory_engagements (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references tenant_groups(id),
  subsidiary_id uuid references subsidiaries(id),
  external_client_id uuid references external_clients(id),
  title text not null,
  scope text,
  status text not null default 'active',
  start_at date,
  end_at date,
  lead_id uuid references users(id),
  created_at timestamptz not null default now()
);

create table if not exists advisory_deliverables (
  id uuid primary key default gen_random_uuid(),
  advisory_engagement_id uuid not null references advisory_engagements(id) on delete cascade,
  title text not null,
  status text not null default 'open',
  due_at date,
  delivered_at date,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_subsidiaries_group_id on subsidiaries(group_id);
create index if not exists idx_locations_subsidiary_id on locations(subsidiary_id);
create index if not exists idx_products_group_id on products(group_id);
create index if not exists idx_variants_product_id on variants(product_id);
create index if not exists idx_stock_levels_location_id on stock_levels(location_id);
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_created_at on orders(created_at);
create index if not exists idx_payment_intents_order_id on payment_intents(order_id);
create index if not exists idx_credit_accounts_reseller_id on credit_accounts(reseller_id);
create index if not exists idx_shipments_order_id on shipments(order_id);
create index if not exists idx_audit_logs_entity on audit_logs(entity_type, entity_id);
create index if not exists idx_external_clients_group_id on external_clients(group_id);
create index if not exists idx_service_requests_assigned_to on service_requests(assigned_to);
create index if not exists idx_employees_department_id on employees(department_id);
create index if not exists idx_journal_entries_period_id on journal_entries(fiscal_period_id);
create index if not exists idx_ledger_entries_company_period on ledger_entries(company_id, period);
create index if not exists idx_intercompany_agreements_provider on intercompany_agreements(provider_company_id);
create index if not exists idx_invoice_lines_invoice_id on invoice_lines(invoice_id);
create index if not exists idx_payments_invoice_id on payments(invoice_id);
create index if not exists idx_wht_credit_notes_issuer_period on wht_credit_notes(issuer_company_id, period);
create index if not exists idx_risk_register_status on risk_register_items(status);
create index if not exists idx_purchase_orders_vendor_id on purchase_orders(vendor_id);
create index if not exists idx_advisory_engagements_client_id on advisory_engagements(external_client_id);
