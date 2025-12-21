# ICG POS Migration Runbook

This runbook covers a one-time migration from the legacy ICG POS system into the unified backend. The ICG system will be sunset after cutover; no long-term integration is planned.

## Goals
- Migrate products, stock, customers, and historical transactions from ICG into the new system.
- Validate data quality and financial totals.
- Cut over to the new POS and unified APIs with minimal downtime.

## Scope
- In: master data (products, barcodes, price lists), inventory balances, customers, sales history, store mappings.
- Out: real-time sync with ICG after cutover.

## Assumptions and prerequisites
- Access to ICG database or export tooling (CSV, SQL dump, or vendor API).
- Store and warehouse master data finalized in the new system.
- Cutover window agreed with business and operations.
- Data mapping and cleansing rules approved.

## Data mapping
| ICG entity | Source fields | Target table | Notes |
| --- | --- | --- | --- |
| Product | product_code, name, brand, sex, concentration, type, status | product, brand | map unique SKU to product.sku |
| Variant | size, unit, barcode | variant | barcode goes to variant.barcode |
| Inventory | store_id, product_code, qty | stock_level | map store_id to location_id |
| Price list | list_name, currency, price | price_list, price_rule | currency default if missing |
| Customer | name, phone, email | customer | dedupe by phone or email |
| Sales | receipt_no, items, totals | order, order_item, payment_intent | tag as historical orders |

## CSV export format
CSV templates are provided in `apps/api/scripts/icg/templates`. Use the same headers in your exports.

Required files:
- `brands.csv` (brand_code, brand_name, status)
- `products.csv` (product_code, name, brand_code, sex, concentration, type, status)
- `variants.csv` (product_code, size, unit, barcode)
- `price_lists.csv` (list_name, currency, channel, valid_from, valid_to)
- `price_rules.csv` (list_name, product_code, variant_barcode, price, min_qty)
- `customers.csv` (name, phone, email, status)
- `inventory.csv` (store_id, product_code, variant_barcode, qty)
- `orders.csv` (receipt_no, store_id, order_date, customer_email, customer_phone, customer_name, total_amount, currency, status, channel)
- `order_items.csv` (receipt_no, line_no, product_code, variant_barcode, quantity, unit_price, total_price)
- `payments.csv` (receipt_no, amount, currency, status, provider, reference, payment_date)

Store to location mapping template:
- `apps/api/scripts/icg/mappings/store-location.template.csv`

## Migration scripts
1) Copy `apps/api/scripts/icg/config.template.json` to `apps/api/scripts/icg/config.json` and fill in values.
2) Run imports in order (use `--dry-run` to preview):

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

Validation:

```
npm --prefix apps/api run icg:validate -- --config scripts/icg/config.json --dir /path/to/csv-folder
```

## Migration phases
1. Discovery
   - Confirm ICG export capabilities and data dictionaries.
   - Identify data gaps or inconsistent fields.

2. Extract
   - Export ICG data by entity into versioned files.
   - Store raw extracts in immutable storage.

3. Transform and cleanse
   - Normalize SKUs, barcodes, currencies, and phone formats.
   - De-duplicate customers and products.
   - Create external_id_map records for traceability.

4. Load
   - Import master data first: brand, product, variant, price_list.
   - Import customers and resellers.
   - Import inventory balances per location.
   - Import historical orders and payments with historical flag.

5. Validate
   - Row counts per entity match expected totals.
   - Inventory totals per store match ICG snapshot.
   - Revenue totals match ICG reports for the selected period.

6. Parallel run (optional)
   - Run new POS in a pilot store while ICG continues elsewhere.
   - Compare daily sales and stock deltas.

7. Cutover
   - Freeze ICG transactions at agreed time.
   - Export final delta and apply to new system.
   - Switch POS endpoints to unified API.

8. Post-cutover
   - Monitor sales, stock accuracy, and payment reconciliation.
   - Archive ICG exports and revoke access.

## Validation checklist
- Products: counts and spot checks for SKU, barcode, and brand.
- Inventory: per-store totals within 0.5 percent variance.
- Orders: totals and tax values match ICG reports.
- Customers: duplicates below agreed threshold.

## Go/No-Go criteria
- All validation checks pass or are signed off by operations.
- POS smoke tests pass at pilot location.
- Payment processing confirmed in staging and production.

## Rollback plan
- If critical errors appear after cutover, pause new POS transactions.
- Restore ICG operations using last known data snapshot.
- Correct mapping issues and re-run migration delta.

## Cutover timeline example
- T-7 days: finalize mapping rules, dry run export/import.
- T-2 days: pilot validation, freeze change requests.
- T-1 day: final rehearsal, approval for cutover.
- T0: export ICG delta, import, switch POS.
- T+1 day: reconciliation and issue triage.

## Ownership and sign-off
- Data lead: approves mapping and validation rules.
- Ops lead: approves cutover timing and store readiness.
- Finance lead: approves revenue reconciliation.
- Engineering lead: approves system readiness and rollback.
