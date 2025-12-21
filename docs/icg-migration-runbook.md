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
| Product | product_code, name, brand, status | product, brand | map unique SKU to product.sku |
| Variant | size, unit, barcode | variant | barcode goes to variant.barcode |
| Inventory | store_id, product_code, qty | stock_level | map store_id to location_id |
| Price list | list_name, currency, price | price_list, price_rule | currency default if missing |
| Customer | name, phone, email | customer | dedupe by phone or email |
| Sales | receipt_no, items, totals | order, order_item, payment_intent | tag as historical orders |

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
