# Data warehouse exports

This adapter exports curated datasets for analytics/data warehouse ingestion. Outputs can be CSV or JSON and optionally pushed to SFTP for downstream loading.

## Setup
1. Copy `config.template.json` to `config.json`.
2. Set `groupId` and `subsidiaryId` (or seed the DB and leave them empty).
3. Ensure `apps/api/.env` includes `DATABASE_URL`.

## Run
- One-off export: `npm --prefix apps/api run warehouse:export`
- Validate templates: `npm --prefix apps/api run warehouse:validate`
- Custom config: `npm --prefix apps/api run warehouse:export -- --config path/to/config.json`
- Dry run: `npm --prefix apps/api run warehouse:export -- --dry-run`

## Exports
- `orders`
- `order-items`
- `payment-intents`
- `products`
- `variants`
- `customers`
- `stock-levels`
- `locations`

## Date filtering
- `startDate` and `endDate` apply to `created_at` for orders, order-items, payment-intents, products, variants, and customers.
- `startDate` and `endDate` apply to `updated_at` for stock-levels and locations.

## SFTP delivery
Set `sftp.enabled` to `true` and provide connection details in `config.json`.
