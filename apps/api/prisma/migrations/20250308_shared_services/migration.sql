-- Shared services, HR, finance, compliance, procurement, advisory

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

create index if not exists idx_external_clients_group_id on external_clients(group_id);
create index if not exists idx_service_requests_assigned_to on service_requests(assigned_to);
create index if not exists idx_employees_department_id on employees(department_id);
create index if not exists idx_journal_entries_period_id on journal_entries(fiscal_period_id);
create index if not exists idx_risk_register_status on risk_register_items(status);
create index if not exists idx_purchase_orders_vendor_id on purchase_orders(vendor_id);
create index if not exists idx_advisory_engagements_client_id on advisory_engagements(external_client_id);
