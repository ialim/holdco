# POS Migration Checklist

This checklist covers the rollout of the new POS that replaces the legacy ICG system.

## Readiness
- [ ] POS hardware inventory completed (terminals, scanners, receipt printers).
- [ ] Store network readiness verified (latency, redundancy, offline fallback).
- [ ] Roles and permissions configured for store staff.
- [ ] Product catalog and price lists validated in the new system.
- [ ] Store locations mapped to `X-Location-Id` values.

## Pilot rollout
- [ ] Select pilot stores and train staff.
- [ ] Run pilot for at least one business cycle (weekend + weekday).
- [ ] Validate sales totals and stock movements vs expected.
- [ ] Capture issues and apply fixes.

## Cutover prep
- [ ] Freeze ICG changes for product/price data.
- [ ] Export and migrate final ICG deltas.
- [ ] Verify POS authentication and payment gateway connectivity.
- [ ] Prepare rollback plan and on-call schedule.

## Cutover
- [ ] Disable ICG transactions at cutover time.
- [ ] Switch POS endpoints to unified API.
- [ ] Perform store smoke tests (sale, refund, receipt, stock decrement).

## Post-cutover
- [ ] Reconcile daily sales and inventory for first 7 days.
- [ ] Monitor payment failures and retry queues.
- [ ] Retire ICG access after stability window.
