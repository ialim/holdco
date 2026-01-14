# UI Implementation Plan

This plan captures the UI stack decisions and the phased implementation for Admin/Ops and Retail POS on top of the unified API.

## Decisions
- Admin/Ops UI: custom web app (Next.js + React-Admin) self-hosted.
- Identity: Keycloak (self-hosted) via OIDC; JWT claims drive RBAC.
- POS UI: Electron for offline durability and peripherals.

Legacy docs (Retool) remain for reference until the custom UI ships:
- Retool setup: `docs/retool-admin-ops.md`
- Retool apps: `docs/retool-admin-ops-apps.md`
- Retool runbook: `docs/retool-implementation-runbook.md`

POS docs:
- Offline architecture: `docs/pos-offline-architecture.md`

## Admin/Ops architecture
- Next.js app with a REST data provider for `/v1/*`.
- Auth: OIDC login, refresh tokens, and role/permission decoding in the client.
- Tenancy: group/subsidiary/location context selector; headers injected into every request.
- RBAC: UI gates based on permissions, API enforces final access control.
- Idempotency: all write requests send `Idempotency-Key`.
- Audit: admin actions surfaced via existing audit logs.

## Admin/Ops scope (MVP to full)
Core:
- Tenancy context selector, user/role viewer, audit log viewer.
Catalog:
- Brands, facets, products, variants, categories.
Pricing:
- Price lists, price rules, promotions.
Inventory:
- Stock levels, adjustments, transfers, reservations.
Orders + Payments:
- Order list/detail, payment intents, refunds.
POS Ops:
- Devices, shifts, cashier PINs, cash drops.
Procurement:
- Suppliers, import shipments, goods receipts.
Finance:
- COA, journals, intercompany, tax outputs.
Reporting:
- Exports and KPI snapshots.

## Milestones (months)
1) Foundation (Weeks 1-3)
- App scaffold, OIDC auth, tenancy context, API client, RBAC gates.
2) Core Admin/Ops (Weeks 4-7)
- Catalog, pricing, inventory read views.
3) Operations (Weeks 8-10)
- Orders/payments views, POS Ops screens, audit log.
4) Finance + Procurement (Weeks 11-14)
- COA, journals, tax reports, procurement flows.
5) Polish + hardening (Weeks 15-18)
- Permissions coverage, QA, performance, docs, rollout plan.

## Dependencies
- Confirm SSO provider and claim format (roles + permissions).
- Confirm required Admin/Ops workflows and data access boundaries.
- Ensure API endpoints for any missing admin flows (e.g., role management).

## JWT claim shape (recommended)
- `sub`: user id (UUID or stable string).
- `email`: user email.
- `name`: display name.
- `roles`: array of role names (e.g., `POS_MANAGER`, `HOLDCO_ADMIN`).
- `permissions`: array of permission strings (same as API).
- Optional tenancy hints: `tenant_group_id`, `subsidiary_ids`, `location_ids`.

## OIDC notes
- Use Authorization Code + PKCE for the Admin app.
- Keycloak client should be public, allow PKCE, and enable CORS for the Admin origin.

## Risks
- Multi-tenant context errors (mitigate with locked selectors + server validation).
- Permission drift between UI and API (mitigate with shared permission map).
- Large datasets in tables (mitigate with server pagination and search).
