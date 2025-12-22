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
- Inventory domain: `warehouse`, `store`, `stock_level`, `transfer`, `adjustment`, `reservation`.
- Pricing domain: `price_list`, `price_rule`, `promotion`, `discount`, `tax_profile`.
- Commerce domain: `cart`, `order`, `order_item`, `invoice`, `payment`, `refund`.
- Credit domain: `reseller`, `credit_account`, `credit_limit`, `payment_schedule`, `repayment`.
- Loyalty domain: `customer`, `loyalty_account`, `points_ledger`, `campaign`.
- Logistics domain (optional): `shipment`, `carrier`, `delivery_slot`, `proof_of_delivery`.
- Legacy mapping: `external_system`, `external_id`, and migration audit tables for ICG cutover.

## Action items
- [ ] Confirm external integrations (payment gateways, logistics partners, accounting exports) and scale targets.
- [x] Define tenancy and authorization model (roles, subsidiary scoping, group level access). See `docs/rbac-policies.md`.
- [x] Draft OpenAPI v1 spec stub and map subsidiary workflows to core services.
- [x] Draft ERD outline with table relationships, keys, and tenant scoping.
- [x] Design event schema, outbox pattern, idempotency strategy, and RabbitMQ topology. See `docs/event-outbox-design.md`.
- [x] Produce an ICG migration runbook (extract, transform, validate, reconcile, cutover).
- [ ] Implement core services with shared primitives (catalog, inventory, pricing, orders).
- [ ] Add subsidiary adapters for wholesale, retail POS replacement, reseller credit, and digital commerce.
- [ ] Integrate payments, logistics, reporting, and audit logging.
- [ ] Roll out in phases: digital commerce first, then retail, then wholesale, then credit.

## Current status
- Completed artifacts: [OpenAPI v1 stub](openapi-v1.yaml), [ERD outline](erd-outline.md), [ICG migration runbook](icg-migration-runbook.md), [ICG CSV tooling](../apps/api/scripts/icg/README.md), [RBAC policies](rbac-policies.md), and [event/outbox design](event-outbox-design.md).
- Implemented modules: catalog, inventory, pricing, orders, payments, credit, loyalty, finance, shared-services, and supporting RBAC/tenancy scaffolding.
- In progress: tenancy enforcement validation across all endpoints, migration dry runs with real exports, and POS cutover readiness.
- Not started: outbox/eventing implementation, integration adapters (payments/logistics/ERP/data warehouse), and load/security test suites.
- Operational: `/v1/metrics` is protected with `METRICS_TOKEN` (see `docs/event-outbox-design.md`).

## Testing and validation
- Contract tests for public API and internal service interfaces.
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
