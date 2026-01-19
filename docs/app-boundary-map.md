# App Boundary Map (Channel Apps)

## Purpose
Define which channels deserve separate apps, which stay in Admin/Ops, and when to split. This keeps UX focused without duplicating backend logic.

## Current App Inventory
- Retail POS (Electron): cashier workflow, offline queue, device peripherals.
- Admin/Ops (Web): catalog, pricing, inventory, procurement, finance, tenancy, IAM.
- Wholesale/Reseller (Web): reseller credit + wholesale orders (`apps/wholesale`).

## Recommended Channel Apps
### 1) Retail POS (Electron)
- Users: cashiers, store managers.
- Workflows: shifts, checkout, tenders, refunds, offline sync.
- Notes: stays separate for offline + device integration.

### 2) Reseller / Wholesale Portal (Web)
- Users: reseller managers, wholesale sales reps.
- Workflows: B2B ordering, credit limits, invoices, repayments, price lists.
- Notes: can start as a role-gated section in Admin/Ops, split once stable.

### 3) Digital Commerce Ops (Web)
- Users: ecommerce managers, merchandisers.
- Workflows: promos, pricing rules, catalog visibility, channel assortment.
- Notes: keep inside Admin/Ops initially; split if team size or cadence grows.

### 4) Logistics / Warehouse Ops (Web)
- Users: warehouse staff, logistics coordinators.
- Workflows: stock movements, delivery slots, proof of delivery.
- Notes: start in Admin/Ops; split if operations need mobile-first or kiosk flows.

### 5) Finance & Shared Services (Web)
- Users: finance, compliance, HR.
- Workflows: COA, journals, tax, intercompany, compliance audits.
- Notes: keep in Admin/Ops; separate only for strict segregation needs.

## Decision Criteria for Splitting
- Offline or device peripherals required.
- Dedicated team with distinct workflows and cadence.
- Data entry UX differs materially from Admin/Ops.
- Security segmentation (different roles, restricted surface).
- Performance or reliability requirements exceed Admin/Ops needs.

## Phased Rollout
Phase 0 (now)
- POS (Electron) + Admin/Ops (Web).

Phase 1 (in progress)
- Reseller/Wholesale portal split started in `apps/wholesale`.
- Keep Digital Commerce inside Admin/Ops unless team size grows.

Phase 2
- Split Logistics/Warehouse if mobile-first or kiosk workflows emerge.

Phase 3
- Separate Digital Commerce admin if marketing requires rapid iteration.

## Shared Platform Responsibilities (Do Not Duplicate)
- Identity (Keycloak), tenant scoping (group/subsidiary/location).
- Catalog + pricing as group-level data with channel-specific assortment.
- Inventory + ledger postings as single source of truth.
- Event/outbox for integration and reconciliation.

## Recommended Next Steps
1) Keep POS separate, continue Admin/Ops as the primary console.
2) Define Reseller/Wholesale portal MVP (credit + ordering + statements). See `docs/reseller-wholesale-mvp.md`.
3) Split only when workflows are validated and a dedicated team exists.
