# POS Rollout Plan

## Objective
Deliver a stable retail POS rollout with offline resilience, correct pricing, and reliable peripherals, while minimizing operational disruption.

## Preconditions
- Device provisioning completed in Admin/Ops (device_id + location_id).
- POS manager and cashier PINs set.
- Subsidiary pricing + assortment validated for pilot locations.
- Payments provider configs (test/prod) entered for pilot subsidiary.
- Hardware inventory confirmed (POS terminals, scanners, printers, cash drawers).

## Phase 0: Preflight (Lab)
**Scope:** 1–2 test devices in a controlled environment.

**Checklist**
- Device activation + cashier login succeed.
- Shift open/close works and appears in Admin/Ops.
- Product search and variant selection work.
- Pricing rules and promotions apply correctly.
- Cash + card/transfer payment completes (online).
- Offline checkout queues and replays after reconnect.
- Receipt printing + cash drawer kick verified.
- Barcode scan triggers search.

**Exit criteria**
- Manual POS smoke checklist passes without blockers.
- Offline queue replay produces no duplicates.
- Receipt formatting is acceptable.

## Phase 1: Pilot Store(s)
**Scope:** 1–2 stores, limited hours, parallel monitoring.

**Operational Steps**
- Train cashiers + managers (device activation, shift, refunds).
- Run POS alongside legacy system if required for 1–2 days.
- Daily reconciliation between POS orders and backend.

**Exit criteria**
- <2% transaction error rate.
- Queue replay succeeds within 5 minutes of reconnect.
- No pricing mismatches across top 50 SKUs.

## Phase 2: Limited Rollout
**Scope:** 20–30% of stores with staggered activation.

**Focus**
- Scale queue replay and offline usage.
- Confirm peripheral stability across device models.
- Validate peak-hour performance.

**Exit criteria**
- Stable throughput at peak hour.
- No critical payment/provider errors.
- Consistent reconciliation results.

## Phase 3: Full Rollout
**Scope:** All retail stores.

**Focus**
- Operational monitoring + incident playbooks.
- Centralized device status dashboards.
- SLA commitments for support response.

## Monitoring & Reporting
- Queue health: pending count + last replay timestamp.
- Failed payments + refund errors by location.
- Orders per hour and average checkout time.
- Pricing mismatch alerts.
- Peripheral error telemetry (printer/scanner failures).

## Rollback Plan
1. Freeze new POS transactions for affected store(s).
2. Re-enable legacy POS endpoint routing.
3. Preserve offline queue for later replay (do not delete).
4. Export completed POS orders for reconciliation.
5. Re-open store on legacy system once reconciliation is stable.

## Training Notes
- Managers: device activation, cashier PIN reset, shift close.
- Cashiers: login, checkout, refunds, offline messaging.
- Ops: reconcile daily orders + payments, manage device issues.
