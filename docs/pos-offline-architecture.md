# POS Offline Architecture (Electron)

This document outlines the offline-first approach for the retail POS desktop app.

## Why Electron
- Local persistence and background sync with reliable retries.
- Full control over file system access for queue durability.
- Easier integration with peripherals (barcode scanners, printers) on Windows terminals.

## Offline queue
- Persist create order and payment operations before attempting network calls.
- Every queued entry includes an idempotency key.
- Replays are sequential to preserve order-level integrity.
- Treat HTTP 409 responses as already processed.

## Device provisioning and shifts
- Register terminals with `POST /v1/pos/devices` (store `device_id` in config).
- Open shifts with `POST /v1/pos/shifts` and close with `POST /v1/pos/shifts/{shift_id}/close`.

## Local cache
- Cache product catalog, price lists, price rules, and promotions.
- Cache by store and channel for fast lookup.
- Refresh on schedule and on login.

## Idempotency key scheme
- Deterministic key per operation scope and payload hash.
- Include device id, order reference, and operation type in the scope.

## Sync and reconciliation
- On reconnect, replay queue then reconcile totals with `/v1/orders` and `/v1/reports/sales`.
- Flag discrepancies for review in Admin/Ops.

## Device provisioning
- Assign a device id per terminal.
- Bind device id to location id for audit and reconciliation.
- Rotate JWTs and require re-auth on expiry.
