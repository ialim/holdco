# Retool App Definition of Done (Phase 1)

Use this as acceptance criteria before an app is considered "done." Each item is required unless marked optional.

## Global criteria (all apps)
- [ ] Uses the shared REST resource and `buildHeaders` helper.
- [ ] All write queries include `Idempotency-Key`.
- [ ] Error handling shows API error messages in a toast.
- [ ] List queries honor tenant scoping (group/subsidiary headers).
- [ ] Pagination and filters return consistent results.
- [ ] App access is restricted to roles with required permissions.

## App 1: Catalog Admin
- [ ] Brands and suppliers are create-only; no edit controls exposed.
- [ ] Product create/update works with optional facets.
- [ ] Variant create/update works and is linked to a product.
- [ ] Facet values only show when a facet is selected.
- [ ] Search input filters list results.

## App 2: Orders & Payments Ops
- [ ] Orders list loads with date + status filters.
- [ ] Order detail shows items and totals.
- [ ] Payment intent create + capture works end-to-end.
- [ ] Refund flow submits successfully and refreshes order detail.
- [ ] Reconcile endpoint executes without errors for a date range.

## App 3: POS Operations
- [ ] Devices list filtered by location.
- [ ] Provision device and update device status both succeed.
- [ ] Start shift works when device is active and location is set.
- [ ] Second open shift for the same device is rejected with a clear error.
- [ ] Close shift updates status and refreshes list.

## App 4: Procurement and Trading Ops
- [ ] Create purchase request and purchase order with items.
- [ ] Create import shipment with lines.
- [ ] Add import costs, receive, and finalize actions all succeed.
- [ ] Shipment status transitions are visible in the list.

## App 5: Finance Ops
- [ ] Create COA, cost center, and fiscal period.
- [ ] Create journal entry with valid lines.
- [ ] Create or update intercompany agreement.
- [ ] Export invoices/journals/payments returns a file or data response.

## App 6: Payments Config and KYC
- [ ] Filter by environment/provider/subsidiary works.
- [ ] Update settlement details and KYC fields without errors.
- [ ] Status changes (draft -> submitted) are enforced by validation rules.
