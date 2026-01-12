# HoldCo POS (Electron)

This folder is a starter shell for the retail POS. It is focused on offline idempotency and local caching, and is not yet a full UI.

## Local config
Copy `config.template.json` to `config.json` and fill values.

Required fields:
- apiBaseUrl
- jwt
- groupId
- subsidiaryId
- locationId
- channel (retail)
- deviceId

Optional fields:
- categoryFacetKey (default: `category`)
- printer (connection details for ESC/POS receipts)

## Locations
The app now loads locations from `GET /v1/locations` using the configured `subsidiaryId`.
Ensure the JWT includes `tenancy.locations.read` permission (or a role that maps to it).
Selecting a location will write `subsidiaryId` and `locationId` into `config.json`.

## Cashier login (hybrid mode)
Cashiers sign in with employee number + PIN via `POST /v1/pos/cashiers/login`.
The returned cashier token is stored in `config.json` and sent on requests as `X-Cashier-Token` for audit attribution.
Cashier PINs are set by a POS manager via `PATCH /v1/pos/cashiers/{user_id}/pin`.

## Device provisioning
Device registration and updates are handled in Admin-Ops (not in the POS app).
Managers can refresh the device token on-site via `POST /v1/pos/devices/activate` (24h JWT).

## Offline queue
Checkout uses the retail adapter (`POST /v1/adapters/retail/checkout`) and is written to the offline queue with an idempotency key. The queue is backed by SQLite (`apps/pos/data/pos.sqlite`) and is replayed on reconnect with idempotent retries.

## Local cache
Catalog filters, product queries, and pricing rules are cached in SQLite for offline use. When online, the app refreshes caches on a timer and falls back to cached data if requests fail.

## Categories
Categories are loaded from `GET /v1/categories` (subsidiary-scoped). If none exist, the POS falls back to facet values from `categoryFacetKey`.

## Next steps
- Add local cache tables for promotions and receipts.
- Expand checkout with pricing rules and customer lookups.

## Receipts + peripherals
Receipts use ESC/POS via USB, network (TCP), or Bluetooth. Set the `printer` block in `config.json`:
- `type`: `usb`, `network`, `bluetooth`, or `none`
- `network.host` + `network.port` (default 9100)
- `usb.vendorId` + `usb.productId` (hex like `0x04b8`)
- `bluetooth.address` (MAC)

Barcode scanners are HID keyboards; the POS listens for fast key bursts ending with Enter and runs a product search automatically.

USB/Bluetooth adapters are optional dependencies. If you need them on Windows, install Visual Studio Build Tools (Desktop development with C++) and rerun `npm install`.
