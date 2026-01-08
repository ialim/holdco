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
Checkout uses the retail adapter (`POST /v1/adapters/retail/checkout`) and is written to the offline queue with an idempotency key. If the network is down, the queue persists to disk and is replayed on reconnect.

## Categories
Categories are loaded from `GET /v1/categories` (subsidiary-scoped). If none exist, the POS falls back to facet values from `categoryFacetKey`.

## Next steps
- Replace the file-backed queue with SQLite for durability and reporting.
- Add local cache tables for catalog, price lists, and promotions.
- Expand checkout with pricing rules and customer lookups.
