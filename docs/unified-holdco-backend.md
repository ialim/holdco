---
name: unified-holdco-backend
description: Unified backend plan for HoldCo subsidiaries on NestJS stack
---
# Plan

Build a unified backend for all subsidiaries using NestJS + Postgres + Redis + RabbitMQ. Start as a modular monolith with clear bounded contexts and event-driven integrations, and replace the ICG POS with a new POS that consumes the unified APIs (no long-term ICG integration).

## Requirements
- Single source of truth for products, inventory, pricing, and customer entities across subsidiaries.
- NestJS API with Postgres system of record, Redis caching, and RabbitMQ for domain events.
- Multi-tenant security model that isolates subsidiary data while enabling group level reporting.
- Support for wholesale, retail, reseller credit sales, digital commerce, and optional logistics flows.
- Flexible pricing and promotion engines with tiered, channel, and volume rules.
- Credit and installment management with limits, repayment tracking, and risk controls.
- ICG POS data migration and clean cutover to the unified APIs.
- Integrations for payments, logistics, ERP/accounting, and analytics under NDPR compliance.

## Scope
- In: Core domain models, unified API layer, subsidiary workflows, audit/logging, reporting, integration hooks, OpenAPI v1 spec stub, ERD outline, and migration runbook.
- Out: Long-term integration with ICG POS, full ERP replacement, advanced WMS/TMS features, and international tax compliance beyond stated regions.

## Files and entry points
- API entry: NestJS `public-api` with `/v1/*` endpoints and subsidiary context headers/claims.
- Core modules/services: `identity`, `catalog`, `inventory`, `pricing`, `orders`, `payments`, `credit`, `loyalty`, `logistics`, `reporting`.
- Integration adapters: `payment-providers`, `shipping-providers`, `erp-sync`, `data-warehouse`.
- Eventing: `events` + `outbox` modules for reliable domain event publishing and async workflows.

## Data model / API changes
- Tenancy: `group_id`, `subsidiary_id` on all domain entities; `location_id` and `channel` on entities that are store/transaction scoped (orders, stock, pricing).
- Product domain: `product`, `variant`, `brand`, `supplier`, `batch`, `lot`, `barcode`.
- Facets: tenant-scoped `facet_definition`, `facet_value`, `product_facet`, `variant_facet` for dynamic attributes (brand, concentration, size, etc).
- Legacy fields `brand_id`, `concentration`, and `size` are deprecated in favor of facets (backfill with `npm --prefix apps/api run facets:backfill`).
- Inventory domain: `warehouse`, `store`, `stock_level`, `transfer`, `adjustment`, `reservation`.
- Trading import workflow: `import_shipment`, `import_shipment_line`, `import_cost_line`, `goods_receipt`, `goods_receipt_line` with landed cost allocation.
- Pricing domain: `price_list`, `price_rule`, `promotion`, `discount`, `tax_profile`.
- Commerce domain: `cart`, `order`, `order_item`, `invoice`, `payment`, `refund`.
- Credit domain: `reseller`, `credit_account`, `credit_limit`, `payment_schedule`, `repayment`.
- Loyalty domain: `customer`, `loyalty_account`, `points_ledger`, `campaign`.
- Logistics domain (optional): `shipment`, `carrier`, `delivery_slot`, `proof_of_delivery`.
- Legacy mapping: `external_system`, `external_id`, and migration audit tables for ICG cutover.

## Facet usage examples
- Filter products: `GET /v1/products?facets=concentration=EDP|occasion=gift`
- Filter variants: `GET /v1/variants?facets=size=100|packaging=tester`
- Create/update with facets: `facets: [{ key: "concentration", value: "EDP" }, { key: "occasion", value: "gift" }]`

## Action items
- [x] Confirm external integrations (payment gateways, logistics partners, accounting exports) and scale targets.
- [x] Define tenancy and authorization model (roles, subsidiary scoping, group level access). See `docs/rbac-policies.md`.
- [x] Draft OpenAPI v1 spec stub and map subsidiary workflows to core services.
- [x] Draft ERD outline with table relationships, keys, and tenant scoping.
- [x] Design event schema, outbox pattern, idempotency strategy, and RabbitMQ topology. See `docs/event-outbox-design.md`.
- [x] Produce an ICG migration runbook (extract, transform, validate, reconcile, cutover).
- [x] Implement core services with shared primitives (catalog, inventory, pricing, orders).
- [x] Add subsidiary adapters for wholesale, retail POS replacement, reseller credit, and digital commerce.
- [x] Integrate payments, logistics, reporting, and audit logging.
- [ ] Roll out in phases: digital commerce first, then retail, then wholesale, then credit.

## Current status
- Completed artifacts: [OpenAPI v1 stub](openapi-v1.yaml), [ERD outline](erd-outline.md), [ICG migration runbook](icg-migration-runbook.md), [ICG CSV tooling](../apps/api/scripts/icg/README.md), [RBAC policies](rbac-policies.md), [event/outbox design](event-outbox-design.md), and [security test checklist](security-test-checklist.md).
- KYC tracker: [payment onboarding tracker](payment-kyc-tracker.md).
- Implemented modules: catalog, inventory, pricing, orders, payments, credit, loyalty, finance, shared-services, events/outbox, and supporting RBAC/tenancy scaffolding.
- Completed: tenancy enforcement validation across all endpoints.
- In progress: migration dry runs with real exports, and POS cutover readiness.
- Completed: audit logging for adapters, payments, logistics, orders, inventory, and credit flows.
- Completed: subsidiary adapters for wholesale, retail POS, reseller credit, and digital commerce.
- Completed: trading import workflow (import shipments, landed cost allocation, goods receipts) and OpenAPI coverage.
- Completed: load test harness and security smoke checklist.
- In progress: data warehouse export adapter (scripts/warehouse).
- Operational: `/v1/metrics` is protected with `METRICS_TOKEN` (see `docs/event-outbox-design.md`).

## Testing and validation
- Contract tests for public API and internal service interfaces.
- Tenant isolation smoke test: `npm --prefix apps/api run tenant:smoke` (requires API running, seeded DB, and `JWT_SECRET`; optional `API_BASE_URL`).
- Adapter flows smoke test: `npm --prefix apps/api run adapter:smoke` (requires API running, seeded DB, and `JWT_SECRET`; optional `API_BASE_URL`).
- Security smoke test: `npm --prefix apps/api run security:smoke` (requires API running, seeded DB, and `JWT_SECRET`; uses `METRICS_TOKEN` if set).
- Security test checklist: `docs/security-test-checklist.md`.
- Load test harness: `npm --prefix apps/api run load:test` (requires API running, seeded DB, and `JWT_SECRET`; optional `DURATION_SECONDS`, `CONCURRENCY`, `REQUEST_DELAY_MS`, `API_BASE_URL`).
- Facet backfill (legacy brand/concentration/size): `npm --prefix apps/api run facets:backfill`.
- Latest load test (defaults):
  - Settings: `DURATION_SECONDS=15`, `CONCURRENCY=5`, `REQUEST_DELAY_MS=0`.
  - Results: 9,065 requests, 0 failures, p50 8.8ms, p95 15.3ms, p99 21.9ms.
  - Endpoints: health 2284 ok, orders.list 2231 ok, products.list 2287 ok, stock-levels.list 2263 ok.
- End to end flow tests for each subsidiary scenario (wholesale, retail, credit, ecom).
- Migration dry runs with reconciliation of product, stock, and transaction totals.
- Load tests for peak campaigns and bulk ordering.
- Security tests for tenancy isolation and data access control.

## Risks and edge cases
- Pricing conflicts across channels and subsidiaries.
- Inventory synchronization between warehouses and stores.
- Credit risk and inconsistent repayment schedules.
- Data migration quality issues and downtime during ICG cutover.
- Eventual consistency gaps between services and async workflows.

## Open questions
- Which payment gateways and logistics partners should be integrated first?
- What are the expected scale targets (orders/day, SKUs, stores, warehouses)?
- What cutover window is acceptable for the ICG POS replacement?

## Recommended integration targets (NG/West Africa)
Payments:
- Paystack + Flutterwave (cards, transfers, USSD)
- Optional secondary: Monnify or Interswitch for deeper bank/USSD coverage

Logistics:
- Aggregator: Shipbubble or Sendbox
- Direct carriers: GIG Logistics, Kwik (metro), DHL/FedEx (international)
- Internal: Alims Logistics as a first-class carrier adapter

ERP/Accounting:
- Enterprise: Sage 50/300 (common locally)
- SMB/flexible: Odoo or QuickBooks
- Interim: CSV/SFTP GL exports until ERP selection is final

## Baseline scale targets
- Stores: 10–50, Warehouses: 1–5, SKUs: 10k–50k
- Orders/day: 1k–5k average, 10k–25k peak
- Inventory transactions/day: 5k–20k
- Peak API throughput: 50–150 req/s during campaigns

## ICG cutover recommendation
- Phased waves: digital commerce → retail pilot stores → full retail → wholesale/credit
- Each wave: weekend overnight freeze, 4–8 hours for final delta load + reconciliation
- Optional 1–2 week ICG read-only period for audit-only access

## Integration checklists
Payments (Paystack/Flutterwave + optional Monnify/Interswitch):
- [x] Confirm supported payment methods (cards, transfer, USSD) by subsidiary/channel (channel-based enforcement).
- [ ] Complete KYC and merchant onboarding for each subsidiary (track in `docs/payment-kyc-tracker.md`; configs via `/v1/payments/providers`).
- [ ] Define settlement accounts and reconciliation cadence.
- [x] Map webhooks/events to internal payment intent states (Paystack/Flutterwave parsers + status updates).
- [ ] Configure test + live keys and NDPR-compliant data handling (env vars documented; secrets still required).
- [ ] Run sandbox E2E: create intent → capture → refund → reconciliation report.
- [x] Decide fallback/secondary gateway routing rules (env-configurable fallback provider).
- [x] Implement Monnify/Interswitch gateway adapters if required (stubs).

Logistics (Shipbubble/Sendbox + GIG/Kwik + DHL/FedEx + Alims Logistics):
- [ ] Confirm service coverage by city, weight, and SLA.
- [ ] Map shipping zones, service levels, and price tables.
- [ ] Define label/waybill format and tracking update cadence.
- [x] Integrate webhook callbacks for shipment status updates.
- [ ] Run pilot shipments for each carrier and validate proof-of-delivery flow.
- [ ] Define returns workflow and reverse logistics handling.

ERP/Accounting (Sage/Odoo/QuickBooks + interim exports):
- [ ] Confirm chart-of-accounts mapping and tax handling rules.
- [x] Decide export format (CSV/SFTP vs API) and schedule.
- [x] Map entities: invoices, payments, credit notes, journals, intercompany.
- [ ] Validate period lock and close process alignment.
- [ ] Run a month-end dry run with reconciliation (trial balance, VAT, WHT).

Cutover readiness:
- [ ] Finalize store/location mapping and ICG export scope.
- [ ] Run migration dry-run and reconcile totals (inventory, sales, payments).
- [ ] Execute pilot cutover with 1–2 stores and capture issues.
- [ ] Lock cutover window, comms, and rollback plan.


