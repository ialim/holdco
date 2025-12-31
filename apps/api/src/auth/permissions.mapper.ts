const SHARED_SERVICES_ALL = [
  "shared_services.third_party.read",
  "shared_services.third_party.write",
  "shared_services.request.create",
  "shared_services.request.read",
  "shared_services.request.assign",
  "shared_services.request.approve",
  "shared_services.request.reject",
  "shared_services.request.start",
  "shared_services.request.complete",
  "shared_services.request.cancel",
];

const HR_ALL = [
  "hr.department.manage",
  "hr.position.manage",
  "hr.employee.manage",
  "hr.leave.manage",
];

const COMPLIANCE_ALL = [
  "compliance.policy.manage",
  "compliance.task.manage",
  "compliance.audit.manage",
  "compliance.risk.manage",
];

const PROCUREMENT_ALL = [
  "procurement.request.manage",
  "procurement.order.manage",
  "procurement.imports.manage",
];

const ADVISORY_ALL = ["advisory.engagement.manage", "advisory.deliverable.manage"];

const FINANCE_ALL = [
  "finance.chart_of_accounts.manage",
  "finance.cost_centers.manage",
  "finance.fiscal_periods.manage",
  "finance.journal_entries.manage",
  "finance.month_close.run",
  "finance.cost_pools.manage",
  "finance.intercompany.agreements.manage",
  "finance.intercompany.generate",
  "finance.invoices.issue",
  "finance.ledger.post",
  "finance.payments.record",
  "finance.wht.schedule.read",
  "finance.wht.remit",
  "finance.vat.generate",
  "finance.vat.file",
  "finance.tax_provisions.generate",
  "finance.tax_provisions.file",
  "finance.period_lock.manage",
  "finance.credit_notes.manage",
  "finance.tax_impact.read",
  "finance.consolidated_pl.read",
  "finance.exports.read",
];

const FINANCE_SUBSIDIARY = [
  "finance.payments.record",
  "finance.wht.schedule.read",
  "finance.wht.remit",
  "finance.vat.generate",
  "finance.vat.file",
  "finance.tax_impact.read",
  "finance.exports.read",
];

const FINANCE_ADMIN = [...FINANCE_ALL, "shared_services.request.read"];

const ROLE_PERMISSION_MAP: Record<string, string[]> = {
  SUPER_ADMIN: ["*"],
  GROUP_ADMIN: ["*"],
  HOLDCO_ADMIN: ["*"],
  HOLDCO_FINANCE: FINANCE_ALL,
  SUBSIDIARY_FINANCE: FINANCE_SUBSIDIARY,
  FINANCE_ADMIN,
  SHARED_SERVICES_MANAGER: [...SHARED_SERVICES_ALL, ...HR_ALL, ...COMPLIANCE_ALL],
  SHARED_SERVICES_AGENT: [
    "shared_services.request.read",
    "shared_services.request.create",
    "shared_services.request.start",
    "shared_services.request.complete",
  ],
  SUBSIDIARY_REQUESTER: ["shared_services.request.read", "shared_services.request.create"],
  HR_MANAGER: [...HR_ALL, "shared_services.request.read"],
  COMPLIANCE_OFFICER: [
    ...COMPLIANCE_ALL,
    "shared_services.request.read",
    "shared_services.request.approve",
    "shared_services.request.reject",
  ],
  PROCUREMENT_MANAGER: [
    ...PROCUREMENT_ALL,
    "shared_services.request.read",
    "shared_services.request.approve",
    "shared_services.request.reject",
  ],
  ADVISORY_LEAD: [...ADVISORY_ALL, "shared_services.request.read"],
  AUDITOR: ["finance.tax_impact.read", "finance.consolidated_pl.read"],
  RBAC_ADMIN: ["rbac.roles.manage", "rbac.permissions.read"],
};

function normalizeRole(role: string): string {
  const normalized = role.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_");
  return normalized.startsWith("ROLE_") ? normalized.slice(5) : normalized;
}

export function mapRolesToPermissions(roles: string[]): string[] {
  const permissions = new Set<string>();
  for (const role of roles) {
    const normalized = normalizeRole(role);
    const mapped = ROLE_PERMISSION_MAP[normalized] ?? ROLE_PERMISSION_MAP[role] ?? [];
    for (const permission of mapped) {
      permissions.add(permission);
    }
  }
  return Array.from(permissions);
}
