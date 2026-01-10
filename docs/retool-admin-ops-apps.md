# Retool Admin/Ops Apps (Phase 1)

This document is a concrete query + component checklist for the Phase 1 Retool apps. Use the REST resource described in `docs/retool-admin-ops.md`.

## Shared setup
- [ ] Create a Retool REST resource with base URL `{{ apiBaseUrl }}`.
- [ ] Required headers: Authorization, X-Group-Id, X-Subsidiary-Id, X-Location-Id (optional), X-Channel.
- [ ] Create global state: `apiBaseUrl`, `jwt`, `groupId`, `subsidiaryId`, `locationId`, `channel`.
- [ ] Add an `idempotencyKey` JS transformer (UUID) and inject into write requests.
- [ ] Standard error handler: show toast with `error.message` and `error.details`.
- [ ] Standard refresh pattern: on create/update, re-run list query and close form.

## App 1: Catalog Admin
Purpose: Manage brands, suppliers, categories, products, variants, facets.
Layout guide: `docs/retool-app1-catalog-layout.md`.
Implementation steps: `docs/retool-app1-catalog-implementation.md`.

Queries checklist:
- [ ] List brands: `GET /brands?limit=50&offset={{tableBrands.offset}}&q={{searchBrands.value}}`
- [ ] Create brand: `POST /brands` (Idempotency-Key)
- [ ] List suppliers: `GET /suppliers?limit=50&offset={{tableSuppliers.offset}}&q={{searchSuppliers.value}}`
- [ ] Create supplier: `POST /suppliers` (Idempotency-Key)
- [ ] List categories: `GET /categories?limit=100&offset={{tableCategories.offset}}&q={{searchCategories.value}}`
- [ ] Create category: `POST /categories` (Idempotency-Key)
- [ ] Update category: `PATCH /categories/{{tableCategories.selectedRow.id}}` (Idempotency-Key)
- [ ] List products: `GET /products?limit=50&offset={{tableProducts.offset}}&q={{searchProducts.value}}`
- [ ] Get product: `GET /products/{{tableProducts.selectedRow.id}}`
- [ ] Create product: `POST /products` (Idempotency-Key)
- [ ] Update product: `PATCH /products/{{tableProducts.selectedRow.id}}` (Idempotency-Key)
- [ ] List variants: `GET /variants?limit=50&offset={{tableVariants.offset}}&q={{searchVariants.value}}`
- [ ] Create variant: `POST /variants` (Idempotency-Key)
- [ ] Update variant: `PATCH /variants/{{tableVariants.selectedRow.id}}` (Idempotency-Key)
- [ ] List facet definitions: `GET /facets?limit=50&offset={{tableFacets.offset}}&q={{searchFacets.value}}`
- [ ] Create facet definition: `POST /facets` (Idempotency-Key)
- [ ] List facet values: `GET /facets/{{tableFacets.selectedRow.id}}/values?limit=50&offset={{facetValues.offset}}`
- [ ] Create facet value: `POST /facets/{{tableFacets.selectedRow.id}}/values` (Idempotency-Key)

Component checklist:
- [ ] Tables for brands, suppliers, categories, products, variants, facets, facet values.
- [ ] Search input for each table; pagination controls.
- [ ] Create/edit drawers for product and variant (validate required fields).
- [ ] Category drawer with filter JSON editors.
- [ ] Facet value drawer tied to selected facet.
- [ ] Success toast + refresh list on create/update.

Field validation checklist:
- Brand
  - [ ] `name`: required, min length 2.
- Supplier
  - [ ] `name`: required, min length 2.
  - [ ] `contact_name`: optional string.
  - [ ] `contact_phone`: optional string.
- Category
  - [ ] `code`: required, min length 2.
  - [ ] `name`: required, min length 2.
  - [ ] `status`: optional enum `active`, `inactive`.
  - [ ] `sort_order`: optional integer.
  - [ ] `product_filters`: optional array of `{ all: [{ key, value }] }`.
  - [ ] `variant_filters`: optional array of `{ all: [{ key, value }] }`.
- Product
  - [ ] `sku`: required, min length 3.
  - [ ] `name`: required, min length 2.
  - [ ] `brand_id`: optional UUID.
  - [ ] `sex`, `concentration`, `type`: optional strings.
  - [ ] `facets`: optional array of `{ key, value }` with non-empty strings.
- Variant
  - [ ] `product_id`: required UUID.
  - [ ] `size`, `unit`, `barcode`: optional strings.
  - [ ] `facets`: optional array of `{ key, value }` with non-empty strings.
- Facet definition
  - [ ] `key`: required, min length 2.
  - [ ] `name`: required, min length 2.
  - [ ] `scope`: optional enum `product` or `variant`.
  - [ ] `data_type`: optional enum `text`.
- Facet value
  - [ ] `value`: required, non-empty string.

Notes:
- No update endpoints for brand or supplier exist right now; expose create-only UI for them.

## App 2: Orders and Payments Ops
Purpose: Track orders, initiate payments, refunds, and reconcile.
Layout guide: `docs/retool-app2-orders-payments-layout.md`.
Implementation steps: `docs/retool-app2-orders-payments-implementation.md`.

Queries checklist:
- [ ] List orders: `GET /orders?limit=50&offset={{tableOrders.offset}}&status={{statusFilter.value}}&start_date={{startDate.value}}&end_date={{endDate.value}}`
- [ ] Get order: `GET /orders/{{tableOrders.selectedRow.id}}`
- [ ] Create payment intent: `POST /payments/intents` (Idempotency-Key)
- [ ] Capture payment: `POST /payments/{{paymentIntentId.value}}/capture` (Idempotency-Key)
- [ ] Create refund: `POST /refunds` (Idempotency-Key)
- [ ] Reconcile payments: `POST /payments/reconcile`

Component checklist:
- [ ] Orders table with status filter and date range.
- [ ] Order detail panel with items and totals.
- [ ] Payment intent form (provider, payment_method, customer_email).
- [ ] Capture action button that uses the payment intent id returned by create intent.
- [ ] Refund modal (amount, reason).

Field validation checklist:
- Order
  - [ ] `items`: required array (at least one item).
  - [ ] `customer_id`: optional UUID.
  - [ ] `reseller_id`: optional UUID.
  - [ ] `currency`: optional 3-letter code (NGN, USD, etc).
- Order item
  - [ ] `product_id`: required UUID.
  - [ ] `variant_id`: optional UUID.
  - [ ] `quantity`: required integer >= 1.
  - [ ] `unit_price`: optional number >= 0.
- Payment intent
  - [ ] `order_id`: required UUID.
  - [ ] `amount`: required number >= 0.
  - [ ] `currency`: required 3-letter code.
  - [ ] `provider`: optional string.
  - [ ] `capture_method`: optional string.
  - [ ] `payment_method`: optional enum `card`, `transfer`, `ussd`.
  - [ ] `customer_email`: optional email (required if the order has no customer email).
- Refund
  - [ ] `payment_id`: required UUID.
  - [ ] `amount`: required number >= 0.
  - [ ] `reason`: optional string.
- Reconcile
  - [ ] `provider`: optional string.
  - [ ] `from`, `to`: optional ISO date strings.

Notes:
- There is no Orders update endpoint; treat order edits as view-only after create.
- Capture uses the payment intent id returned from create intent, not an order id.

## App 3: POS Operations
Purpose: Provision devices and manage shifts per location.
Layout guide: `docs/retool-app3-pos-layout.md`.
Implementation steps: `docs/retool-app3-pos-implementation.md`.

Queries checklist:
- [ ] List locations: `GET /locations?subsidiary_id={{subsidiaryId}}&limit=50`
- [ ] List devices: `GET /pos/devices?subsidiary_id={{subsidiaryId}}&location_id={{locationId}}&q={{deviceSearch.value}}`
- [ ] Provision device: `POST /pos/devices` (Idempotency-Key, `X-Channel: admin_ops`)
- [ ] Update device: `PATCH /pos/devices/{{tableDevices.selectedRow.device_id}}` (Idempotency-Key)
- [ ] List shifts: `GET /pos/shifts?location_id={{locationId}}&status={{shiftStatus.value}}&start_date={{startDate.value}}&end_date={{endDate.value}}`
- [ ] Get shift: `GET /pos/shifts/{{tableShifts.selectedRow.id}}`
- [ ] Start shift: `POST /pos/shifts` (Idempotency-Key)
- [ ] Close shift: `POST /pos/shifts/{{tableShifts.selectedRow.id}}/close` (Idempotency-Key)

Component checklist:
- [ ] Devices table with status, last seen, metadata.
- [ ] Device drawer (name, status, location_id, metadata).
- [ ] Shifts table with open/closed, floats, operator.
- [ ] Start/close shift forms (opening/closing float, notes).

Field validation checklist:
- POS device (provision)
  - [ ] `device_id`: required string (unique per group).
  - [ ] `location_id`: required UUID.
  - [ ] `name`: optional string.
  - [ ] `status`: optional enum `active`, `inactive`, `retired`.
  - [ ] `metadata`: optional object (JSON).
- POS device (update)
  - [ ] `location_id`: optional UUID.
  - [ ] `name`: optional string.
  - [ ] `status`: optional enum `active`, `inactive`, `retired`.
  - [ ] `metadata`: optional object (JSON).
- Start shift
  - [ ] `device_id`: required string.
  - [ ] `opening_float`: optional number >= 0.
  - [ ] `opened_by_id`: optional UUID.
  - [ ] `notes`: optional string.
- Close shift
  - [ ] `closing_float`: optional number >= 0.
  - [ ] `closed_by_id`: optional UUID.
  - [ ] `notes`: optional string.

Notes:
- Start shift requires `X-Location-Id` header and the device must belong to that location.
- Only one open shift per device; surface a clear error when a shift is already open.
- Status filters: devices (`active`, `inactive`, `retired`), shifts (`open`, `closed`).

## App 4: Procurement and Trading Ops
Purpose: Track purchase requests/orders and import shipments (costs, receive, finalize).
Layout guide: `docs/retool-app4-procurement-layout.md`.
Implementation steps: `docs/retool-app4-procurement-implementation.md`.

Queries checklist:
- [ ] List purchase requests: `GET /procurement/purchase-requests?limit=50&offset={{tableRequests.offset}}&status={{statusFilter.value}}`
- [ ] Create purchase request: `POST /procurement/purchase-requests` (Idempotency-Key)
- [ ] List purchase orders: `GET /procurement/purchase-orders?limit=50&offset={{tableOrders.offset}}&status={{statusFilter.value}}`
- [ ] Create purchase order: `POST /procurement/purchase-orders` (Idempotency-Key)
- [ ] List import shipments: `GET /procurement/import-shipments?limit=50&offset={{tableShipments.offset}}&status={{statusFilter.value}}`
- [ ] Create import shipment: `POST /procurement/import-shipments` (Idempotency-Key)
- [ ] Add import costs: `POST /procurement/import-shipments/{{tableShipments.selectedRow.id}}/costs` (Idempotency-Key)
- [ ] Receive import shipment: `POST /procurement/import-shipments/{{tableShipments.selectedRow.id}}/receive` (Idempotency-Key)
- [ ] Finalize import shipment: `POST /procurement/import-shipments/{{tableShipments.selectedRow.id}}/finalize` (Idempotency-Key)

Component checklist:
- [ ] Purchase requests table + create form.
- [ ] Purchase orders table + create form.
- [ ] Import shipments table with detail panel for lines.
- [ ] Costs form (lines, fx, amounts) and receive/finalize actions.

Field validation checklist:
- Purchase request
  - [ ] `items`: required array (min 1).
  - [ ] `requester_id`: optional UUID.
  - [ ] `needed_by`: optional date string.
  - [ ] `notes`: optional string.
- Purchase request item
  - [ ] `description`: required non-empty string.
  - [ ] `quantity`: required integer >= 1.
  - [ ] `unit`: optional string.
  - [ ] `estimated_unit_cost`: optional number >= 0.
- Purchase order
  - [ ] `vendor_id`: required UUID.
  - [ ] `ordered_at`, `expected_at`: optional date strings.
  - [ ] `currency`: optional string.
  - [ ] `items`: required array (min 1).
- Purchase order item
  - [ ] `description`: required non-empty string.
  - [ ] `quantity`: required integer >= 1.
  - [ ] `unit_price`: required number >= 0.
  - [ ] `total_price`: optional number >= 0.
- Import shipment
  - [ ] `reference`: required string.
  - [ ] `supplier_id`: optional UUID.
  - [ ] `currency`: required string.
  - [ ] `fx_rate`: required number >= 0.
  - [ ] `arrival_date`: optional date string.
  - [ ] `lines`: required array (min 1).
- Import shipment line
  - [ ] `product_id`: required UUID.
  - [ ] `variant_id`: optional UUID.
  - [ ] `quantity`: required integer >= 1.
  - [ ] `unit_cost`: required number >= 0.
- Import costs
  - [ ] `costs`: required array (min 1).
  - [ ] Each line: `category` required string, `amount` required number >= 0, `notes` optional.
- Receive import shipment
  - [ ] `location_id`: required UUID.
  - [ ] `received_at`: optional date string.
  - [ ] `notes`: optional string.
  - [ ] `lines`: required array (min 1).
- Receive line
  - [ ] `product_id`: required UUID.
  - [ ] `variant_id`: optional UUID.
  - [ ] `quantity_received`: required integer >= 0.
  - [ ] `quantity_rejected`: optional integer >= 0.

Notes:
- Ensure `supplier_id` or `vendor_id` maps to an ExternalClient of type supplier.

## App 5: Finance Ops
Purpose: Manage COA, intercompany agreements, invoices, and exports.
Layout guide: `docs/retool-app5-finance-layout.md`.
Implementation steps: `docs/retool-app5-finance-implementation.md`.

Queries checklist:
- [ ] List COA: `GET /finance/accounts?limit=100&offset={{coaTable.offset}}`
- [ ] Create COA: `POST /finance/accounts` (Idempotency-Key)
- [ ] List cost centers: `GET /finance/cost-centers?limit=50&offset={{costCenterTable.offset}}`
- [ ] Create cost center: `POST /finance/cost-centers` (Idempotency-Key)
- [ ] List fiscal periods: `GET /finance/fiscal-periods?limit=50&offset={{periodTable.offset}}`
- [ ] Create fiscal period: `POST /finance/fiscal-periods` (Idempotency-Key)
- [ ] List journal entries: `GET /finance/journal-entries?limit=50&offset={{journalTable.offset}}`
- [ ] Create journal entry: `POST /finance/journal-entries` (Idempotency-Key)
- [ ] Create intercompany agreement: `POST /finance/intercompany-agreements` (Idempotency-Key)
- [ ] Update intercompany agreement: `PATCH /finance/intercompany-agreements/{{agreementId}}` (Idempotency-Key)
- [ ] Export invoices: `GET /finance/exports/invoices?start_date={{startDate.value}}&end_date={{endDate.value}}`
- [ ] Export journals: `GET /finance/exports/journals?start_date={{startDate.value}}&end_date={{endDate.value}}`
- [ ] Export payments: `GET /finance/exports/payments?start_date={{startDate.value}}&end_date={{endDate.value}}`

Component checklist:
- [ ] COA grid with type filter and create drawer.
- [ ] Cost centers table + create form.
- [ ] Fiscal periods table + create form.
- [ ] Journal entries table + create form.
- [ ] Intercompany agreement form (provider/recipient, pricing model, rates).
- [ ] Export panel with date range + download link.

Field validation checklist:
- Chart of accounts
  - [ ] `code`: required string.
  - [ ] `name`: required string.
  - [ ] `type`: required enum `asset`, `liability`, `equity`, `income`, `expense`, `cogs`.
  - [ ] `parent_id`: optional UUID.
- Cost center
  - [ ] `code`: required string.
  - [ ] `name`: required string.
- Fiscal period
  - [ ] `name`: required string.
  - [ ] `start_date`, `end_date`: required ISO date strings.
  - [ ] `status`: optional enum `open`, `closed`, `locked`.
- Journal entry
  - [ ] `fiscal_period_id`: required UUID.
  - [ ] `reference`, `memo`: optional strings.
  - [ ] `lines`: required non-empty array.
- Journal line
  - [ ] `account_id`: required UUID.
  - [ ] `cost_center_id`: optional UUID.
  - [ ] `description`: optional string.
  - [ ] `debit`, `credit`: optional numbers (one side should be set).
- Intercompany agreement (create)
  - [ ] `provider_company_id`: required UUID.
  - [ ] `recipient_company_id`: required UUID.
  - [ ] `type`: required enum `MANAGEMENT`, `PRODUCT_SUPPLY`, `LOGISTICS`, `IP_LICENSE`.
  - [ ] `pricing_model`: required enum `COST_PLUS`, `FIXED_MONTHLY`, `ROYALTY_PERCENT`.
  - [ ] `markup_rate`, `fixed_fee_amount`: optional numbers.
  - [ ] `vat_applies`, `wht_applies`: optional booleans.
  - [ ] `vat_rate`, `wht_rate`: optional numbers.
  - [ ] `wht_tax_type`: optional enum `SERVICES`, `GOODS`, `RENT`, `INTEREST`, `ROYALTIES`.
  - [ ] `effective_from`: required ISO date.
  - [ ] `effective_to`: optional ISO date.
- Intercompany agreement (update)
  - [ ] Same fields as create, all optional.
- Exports
  - [ ] `format`: optional enum `json`, `csv`.
  - [ ] `period`: optional string.
  - [ ] `fiscal_period_id`: optional UUID.
  - [ ] `invoice_type`: optional string.
  - [ ] `start_date`, `end_date`: optional ISO dates.

Notes:
- There is no general invoice list endpoint; finance UI should rely on export endpoints and intercompany invoice generation/issue flows.

## App 6: Payments Config and KYC
Purpose: Track provider onboarding per subsidiary.
Layout guide: `docs/retool-app6-payments-config-layout.md`.
Implementation steps: `docs/retool-app6-payments-config-implementation.md`.

Queries checklist:
- [ ] List configs: `GET /payments/providers?subsidiary_id={{subsidiaryId}}&environment={{env.value}}`
- [ ] Update config: `PATCH /payments/providers/{{tableConfigs.selectedRow.id}}`

Component checklist:
- [ ] Config table by subsidiary, provider, environment.
- [ ] Status tracker (draft/submitted/approved/rejected).
- [ ] Settlement details form with validation.

Field validation checklist:
- Payment provider config (create)
  - [ ] `subsidiary_id`: required UUID.
  - [ ] `provider`: required enum `paystack`, `flutterwave`, `monnify`, `interswitch`.
  - [ ] `environment`: optional enum `test`, `live`.
  - [ ] `status`: optional enum `draft`, `submitted`, `approved`, `rejected`.
  - [ ] `settlement_account_name`: optional string.
  - [ ] `settlement_account_number`: optional string.
  - [ ] `settlement_bank_name`: optional string.
  - [ ] `settlement_bank_code`: optional string.
  - [ ] `settlement_currency`: optional 3-letter code.
  - [ ] `contact_name`: optional string.
  - [ ] `contact_email`: optional email.
  - [ ] `contact_phone`: optional string.
  - [ ] `provider_merchant_id`: optional string.
  - [ ] `kyc_submitted_at`: optional ISO date.
  - [ ] `kyc_approved_at`: optional ISO date.
  - [ ] `kyc_notes`: optional string.
- Payment provider config (update)
  - [ ] Same fields as create, all optional.

Notes:
- Use one record per subsidiary + provider + environment.
