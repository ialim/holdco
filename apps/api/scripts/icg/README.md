# ICG Migration Scripts

These scripts load legacy ICG CSV exports into the unified backend. Imports are idempotent via `external_id_maps`, so you can rerun safely.

## Setup
1) Copy config template:
   - `apps/api/scripts/icg/config.template.json` -> `apps/api/scripts/icg/config.json`
2) Fill in:
   - `groupId`
   - `defaultCurrency`
   - `storeLocationMapFile`
   - `defaultSubsidiaryId` (if your store map does not include subsidiary_id)
3) Copy the store/location mapping template:
   - `apps/api/scripts/icg/mappings/store-location.template.csv` -> `apps/api/scripts/icg/mappings/store-location.csv`

CSV templates live in `apps/api/scripts/icg/templates/`. Ensure your exports use the same headers.

## Import order
Run with `--dry-run` first to preview.

```
npm --prefix apps/api run icg:import:brands -- --config scripts/icg/config.json --file /path/to/brands.csv
npm --prefix apps/api run icg:import:products -- --config scripts/icg/config.json --file /path/to/products.csv
npm --prefix apps/api run icg:import:variants -- --config scripts/icg/config.json --file /path/to/variants.csv
npm --prefix apps/api run icg:import:price-lists -- --config scripts/icg/config.json --file /path/to/price_lists.csv
npm --prefix apps/api run icg:import:price-rules -- --config scripts/icg/config.json --file /path/to/price_rules.csv
npm --prefix apps/api run icg:import:customers -- --config scripts/icg/config.json --file /path/to/customers.csv
npm --prefix apps/api run icg:import:inventory -- --config scripts/icg/config.json --file /path/to/inventory.csv
npm --prefix apps/api run icg:import:orders -- --config scripts/icg/config.json --file /path/to/orders.csv
npm --prefix apps/api run icg:import:order-items -- --config scripts/icg/config.json --file /path/to/order_items.csv
npm --prefix apps/api run icg:import:payments -- --config scripts/icg/config.json --file /path/to/payments.csv
```

## Validation
```
npm --prefix apps/api run icg:validate -- --config scripts/icg/config.json --dir /path/to/csv-folder
```

## Notes
- Store/location mapping is mandatory for inventory and orders.
- External IDs are stored under entity types: brand, product, variant, price_list, customer, order, order_item, payment_intent.
