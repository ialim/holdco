# RBAC Policies

This document defines role-based access control (RBAC) policies for the unified backend, with emphasis on shared-services requests and approvals. Permissions are enforced by the API layer using group and subsidiary scoping from headers and JWT claims.

## Scoping rules
- Group-scope roles can access all subsidiaries within the group.
- Subsidiary-scope roles can access only their assigned subsidiary (and optional location).
- Users cannot approve their own shared-services requests (segregation of duties).

## Permission codes (recommended)
Tenancy
- `tenancy.read`
- `tenancy.users.read`

Catalog
- `catalog.brand.read`
- `catalog.brand.write`
- `catalog.supplier.read`
- `catalog.supplier.write`
- `catalog.product.read`
- `catalog.product.write`
- `catalog.variant.read`
- `catalog.variant.write`

Inventory
- `inventory.stock.read`
- `inventory.stock.adjust`
- `inventory.stock.transfer`
- `inventory.stock.reserve`

Pricing
- `pricing.price_list.read`
- `pricing.price_list.write`
- `pricing.price_rule.read`
- `pricing.price_rule.write`
- `pricing.promotion.read`
- `pricing.promotion.write`

Orders
- `orders.read`
- `orders.write`
- `orders.cancel`
- `orders.fulfill`

Payments
- `payments.intent.create`
- `payments.capture`
- `payments.refund`
- `payments.reconcile`

Credit & collections
- `credit.reseller.read`
- `credit.reseller.write`
- `credit.account.read`
- `credit.account.write`
- `credit.limit.write`
- `credit.repayment.write`

Loyalty
- `loyalty.customer.read`
- `loyalty.customer.write`
- `loyalty.account.read`
- `loyalty.account.write`
- `loyalty.points.issue`

Logistics
- `logistics.shipment.read`
- `logistics.shipment.write`

Reports
- `reports.sales`
- `reports.inventory`
- `reports.credit`

Shared services
- `shared_services.third_party.read`
- `shared_services.third_party.write`
- `shared_services.request.create`
- `shared_services.request.read`
- `shared_services.request.assign`
- `shared_services.request.approve`
- `shared_services.request.reject`
- `shared_services.request.start`
- `shared_services.request.complete`
- `shared_services.request.cancel`

HR
- `hr.department.manage`
- `hr.position.manage`
- `hr.employee.manage`
- `hr.leave.manage`

Finance
- `finance.chart_of_accounts.manage`
- `finance.cost_centers.manage`
- `finance.fiscal_periods.manage`
- `finance.journal_entries.manage`
- `finance.month_close.run`
- `finance.cost_pools.manage`
- `finance.intercompany.generate`
- `finance.invoices.issue`
- `finance.ledger.post`
- `finance.payments.record`
- `finance.wht.schedule.read`
- `finance.wht.remit`
- `finance.vat.generate`
- `finance.vat.file`
- `finance.period_lock.manage`
- `finance.credit_notes.manage`
- `finance.tax_impact.read`
- `finance.consolidated_pl.read`
- `finance.exports.read`

Compliance & risk
- `compliance.policy.manage`
- `compliance.task.manage`
- `compliance.audit.manage`
- `compliance.risk.manage`

Procurement
- `procurement.request.manage`
- `procurement.order.manage`

Advisory
- `advisory.engagement.manage`
- `advisory.deliverable.manage`

RBAC administration
- `rbac.roles.manage`
- `rbac.permissions.read`

## Role presets (examples)
- Group Admin: all permissions; can approve, assign, and manage across subsidiaries.
- Shared Services Manager: shared services + HR + compliance; can approve and assign.
- Shared Services Agent: shared services read/create/start/complete for assigned requests.
- Subsidiary Requester: shared_services.request.create/read for their subsidiary only.
- Finance Admin: finance permissions; view shared-services requests in financial categories.
- HR Manager: HR permissions; view shared-services requests in HR categories.
- Compliance Officer: compliance permissions; approve compliance/risk requests.
- Procurement Manager: procurement permissions; approve procurement-related requests.
- Advisory Lead: advisory permissions; manage advisory engagements/deliverables.
- Auditor: read-only access to audit, compliance, and finance.

## Approval rules
- Requests in categories `financial`, `accounting`, `auditing`, `compliance`, `risk_management`, and `procurement` require approval.
- Approvers must be group-scope or designated approvers for the category.
- A requester cannot approve their own request.

## Endpoint mapping (shared services)
- Create request: `POST /v1/shared-services/requests` -> `shared_services.request.create`
- List/get request: `GET /v1/shared-services/requests` and `GET /v1/shared-services/requests/{service_request_id}` -> `shared_services.request.read`
- Assign: `POST /v1/shared-services/requests/{service_request_id}/assign` -> `shared_services.request.assign`
- Approve: `POST /v1/shared-services/requests/{service_request_id}/approve` -> `shared_services.request.approve`
- Reject: `POST /v1/shared-services/requests/{service_request_id}/reject` -> `shared_services.request.reject`
- Start: `POST /v1/shared-services/requests/{service_request_id}/start` -> `shared_services.request.start`
- Complete: `POST /v1/shared-services/requests/{service_request_id}/complete` -> `shared_services.request.complete`
- Cancel: `POST /v1/shared-services/requests/{service_request_id}/cancel` -> `shared_services.request.cancel`

## Endpoint mapping (RBAC)
- List roles: `GET /v1/roles` -> `rbac.roles.manage`
- Create role: `POST /v1/roles` -> `rbac.roles.manage`
- Set role permissions: `POST /v1/roles/{role_id}/permissions` -> `rbac.roles.manage`
- Assign user role: `POST /v1/users/{user_id}/roles` -> `rbac.roles.manage`
- List permissions: `GET /v1/permissions` -> `rbac.permissions.read`
