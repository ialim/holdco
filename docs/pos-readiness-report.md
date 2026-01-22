# POS Readiness Report

## Status (Automated)
Run from `apps/api`:
- `npm run tenant:smoke` ✅
- `npm run adapter:smoke` ✅
- `npm run security:smoke` ✅

These cover tenant scoping, adapter flows (retail/wholesale/credit), and RBAC enforcement.

## Manual POS Smoke Checklist (Pilot)
Run on a provisioned device with printer + scanner attached.

### Device + Auth
- [ ] Device is provisioned in Admin/Ops and token is active.
- [ ] Manager activation refreshes the device token (24h) successfully.
- [ ] Cashier login works (employee number + PIN).
- [ ] Shift open/close works and is reflected in Admin/Ops.

### Catalog + Pricing
- [ ] Product search (name/sku/barcode) returns results.
- [ ] Variant picker lists only variants for the selected product.
- [ ] Price list + price rules apply to cart totals.
- [ ] Promotions apply correctly (if configured).

### Checkout + Payments
- [ ] Cash payment completes and posts to backend.
- [ ] Card/transfer payment intent + capture completes (online).
- [ ] Refund flow completes and prints receipt.
- [ ] Credit checkout (if enabled) requires manager and customer with credit limit.

### Offline Mode
- [ ] Disable network → checkout queues with idempotency key.
- [ ] Queue persists across restart (SQLite).
- [ ] Reconnect → queued ops replay and reconcile without duplicates.
- [ ] Offline receipt prints (if configured to allow).

### Peripherals
- [ ] Receipt printer test prints correctly.
- [ ] Cash drawer kick triggers on payment (if enabled).
- [ ] Barcode scanner triggers search on scan.

## Known Gaps / Risks (Confirm Before Prod)
- Offline sync reconciliation needs end-to-end validation at store scale.
- Peripheral reliability across device models needs pilot coverage.
- Tender variants (split/instalment/points/deposit) require final verification.
- Cache staleness handling (pricing/promotions) needs operational policy.

## Recommendation
Ready for **internal pilot** once the manual smoke checklist passes on 1–2 real devices.
Not ready for full production until pilot results are stable and peripheral reliability is confirmed.
