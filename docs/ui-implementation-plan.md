# UI Implementation Plan

This plan captures the UI stack decisions and the first implementation steps for Admin/Ops and Retail POS on top of the unified API.

## Decisions
- Admin/Ops UI: Retool for internal tooling speed and maintainability.
- POS UI: Electron for the strongest offline idempotency support (local DB + durable queue).

Related docs:
- Retool setup: `docs/retool-admin-ops.md`
- Retool apps: `docs/retool-admin-ops-apps.md`
- Retool runbook: `docs/retool-implementation-runbook.md`
- POS offline architecture: `docs/pos-offline-architecture.md`

## Admin/Ops (Retool)
- Primary use cases: catalog, inventory, pricing, orders, payments config, procurement, finance, and audit views.
- API resource: `/v1/*` endpoints with `Authorization` plus tenant headers (`X-Group-Id`, `X-Subsidiary-Id`, `X-Location-Id` when needed, `X-Channel`).
- Writes must send `Idempotency-Key` to support safe retries.
- Security: store JWTs in Retool secrets/environment variables; limit access by role and subsidiary.
- Rollout: start with read-heavy dashboards, then CRUD flows with validation.

## POS (Electron)
- Local store: SQLite (or equivalent embedded DB) for catalog, price lists, promotions, and offline queue. (done)
- Offline queue: persist `order`, `payment intent`, and `capture` requests with deterministic idempotency keys. (done)
- Sync loop: replay queue on reconnect, treat `409 Conflict` as already processed, reconcile totals. (done)
- Device provisioning: introduce device ID and store mapping for unique idempotency scopes.
- Observability: local logs plus server-side audit events per request.

## Phased rollout
1. Retool MVP: dashboards + core CRUD for Admin/Ops.
2. POS prototype: core retail checkout (product lookup, price, order create, payment intent).
3. Pilot: a small set of stores with offline mode and reconciliation.

## Dependencies
- Confirm POS hardware/OS targets and peripherals (barcode scanner, receipt printer).
- Confirm which Admin/Ops workflows require custom web beyond Retool.

## Risks
- Offline divergence and delayed reconciliation if devices stay offline too long.
- Token expiry while offline; plan for token refresh and re-auth.
- Retool limits for very high-volume workflows.
