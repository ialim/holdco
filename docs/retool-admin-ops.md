# Retool Admin/Ops Setup

This document defines the recommended Retool setup for the Admin/Ops UI. Retool is preferred over a custom web app for faster delivery of internal tooling, dashboards, and CRUD workflows.

Phase 1 app list and query blueprints: `docs/retool-admin-ops-apps.md`.
Implementation sequence: `docs/retool-implementation-runbook.md`.

## Global helpers (copy/paste)
Create a JS transformer named `buildHeaders` (replace variable names with your Retool state keys):

```js
const headers = {
  Authorization: `Bearer ${jwt}`,
  "X-Group-Id": groupId,
  "X-Subsidiary-Id": subsidiaryId,
  "X-Location-Id": locationId || undefined,
  "X-Channel": channel || "admin_ops",
};

return Object.fromEntries(Object.entries(headers).filter(([, value]) => value));
```

Create a JS transformer named `newIdempotencyKey`:

```js
return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
```

Usage:
- Set request headers to `{{buildHeaders.value}}`.
- For write requests, add `Idempotency-Key: {{newIdempotencyKey.value}}`.

## Resource setup
- Create a REST API resource named "HoldCo API".
- Base URL: `http://localhost:3000/v1` (or your deployed API base).
- Default headers:
  - `Authorization: Bearer {{current_user.jwt}}` or a secret token
  - `X-Group-Id: {{current_user.group_id}}`
  - `X-Subsidiary-Id: {{current_user.subsidiary_id}}`
  - `X-Location-Id: {{current_user.location_id}}` (only for store-scoped queries)
  - `X-Channel: {{current_user.channel}}`

## Idempotency rules
- All write operations must include `Idempotency-Key`.
- Generate a new UUID for each create or update request.
- If a retry is required, reuse the same key.

## Core Admin/Ops apps (phase 1)
- Tenant admin: groups, subsidiaries, locations, roles.
- Catalog admin: products, variants, facets, brands, suppliers.
- Inventory admin: stock levels, transfers, adjustments.
- Pricing admin: price lists, price rules, promotions.
- Orders and payments: list, inspect, refunds.
- Procurement: import shipments, goods receipts, landed costs.
- Finance: chart of accounts, intercompany agreements, invoices.
- Payments config: provider configs and KYC status tracking.
- POS operations: devices, shifts, and store activity.
- Audit and logs: adapter events and security logs.

## Security and access
- Use RBAC from `docs/rbac-policies.md` to limit Retool apps by role.
- Use per-subsidiary permissions for sensitive workflows (payments, finance).

## Operational notes
- Read-heavy dashboards should use pagination and filters.
- Large exports should use backend export endpoints when available.

## Query examples
- List POS devices: `GET /pos/devices?subsidiary_id={{subsidiary_id}}&limit=50`
- Provision POS device: `POST /pos/devices` with `{ \"device_id\": \"POS-001\", \"location_id\": \"...\" }` and `X-Channel: admin_ops`
- List shifts: `GET /pos/shifts?location_id={{location_id}}&status=open`
