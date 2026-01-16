# Retool App Build Checklists (Phase 1)

Use these ordered checklists when building each Retool app. Each checklist follows the pattern: Queries -> Components -> Bindings -> QA. Pair with the layout guides and query definitions in `docs/retool-admin-ops-apps.md`.

## App 1: Catalog Admin
Layout guide: `docs/retool-app1-catalog-layout.md`.

Queries
- [ ] Create list queries: `qListBrands`, `qListSuppliers`, `qListCategories`, `qListProducts`, `qListVariants`, `qListFacets`, `qListFacetValues`.
- [ ] Create write queries: `qCreateBrand`, `qCreateSupplier`, `qCreateCategory`, `qCreateProduct`, `qCreateVariant`, `qCreateFacet`, `qCreateFacetValue`.
- [ ] Create update queries: `qUpdateCategory`, `qUpdateProduct`, `qUpdateVariant`.
- [ ] Optional detail query: `qGetProduct`.
- [ ] All write queries include `Idempotency-Key` from `newIdempotencyKey`.

Components
- [ ] Tabs: Brands, Suppliers, Categories, Products, Variants, Facets, Facet Values.
- [ ] Tables: `tableBrands`, `tableSuppliers`, `tableCategories`, `tableProducts`, `tableVariants`, `tableFacets`, `tableFacetValues`.
- [ ] Inputs: `searchBrands`, `searchSuppliers`, `searchCategories`, `searchProducts`, `searchVariants`, `searchFacets`.
- [ ] Drawers: `drawerBrand`, `drawerSupplier`, `drawerCategory`, `drawerProduct`, `drawerVariant`, `drawerFacet`, `drawerFacetValue`.
- [ ] Buttons: create actions per tab.

Bindings
- [ ] Tables bind to list queries.
- [ ] Search inputs re-run list queries on change.
- [ ] `tableProducts` row select -> `qGetProduct` (if used).
- [ ] `tableFacets` row select -> `qListFacetValues`.
- [ ] Drawer submit -> create/update query -> refresh list + close drawer.

QA
- [ ] Create brand and supplier (create-only).
- [ ] Create and update a category with filters.
- [ ] Create and update product/variant with facets.
- [ ] Facet values visible only when a facet is selected.
- [ ] Pagination + filters return expected results.

## App 2: Orders & Payments Ops
Layout guide: `docs/retool-app2-orders-payments-layout.md`.

Queries
- [ ] Create list/detail queries: `qListOrders`, `qGetOrder`.
- [ ] Create payment queries: `qCreatePaymentIntent`, `qCapturePaymentIntent`.
- [ ] Create refund and reconcile queries: `qCreateRefund`, `qReconcilePayments`.
- [ ] All write queries include `Idempotency-Key`.

Components
- [ ] Filters: `statusFilter`, `dateRange`.
- [ ] Table: `tableOrders`.
- [ ] Detail panel: `panelOrder`.
- [ ] Drawer: `drawerPaymentIntent`.
- [ ] Modal: `modalRefund`.
- [ ] Buttons: capture payment, reconcile payments.

Bindings
- [ ] Filters re-run `qListOrders`.
- [ ] `tableOrders` row select -> `qGetOrder` -> populate `panelOrder`.
- [ ] `drawerPaymentIntent` submit -> `qCreatePaymentIntent` -> store intent id.
- [ ] Capture button uses stored intent id -> `qCapturePaymentIntent`.
- [ ] `modalRefund` submit -> `qCreateRefund`.
- [ ] Reconcile button -> `qReconcilePayments`.

QA
- [ ] Create payment intent then capture it.
- [ ] Create refund and verify order refresh.
- [ ] Reconcile for a date range without errors.

## App 3: POS Operations
Layout guide: `docs/retool-app3-pos-layout.md`.

Queries
- [ ] Location query: `qListLocations`.
- [ ] Device queries: `qListDevices`, `qProvisionDevice`, `qUpdateDevice`.
- [ ] Shift queries: `qListShifts`, `qGetShift`, `qStartShift`, `qCloseShift`.
- [ ] All write queries include `Idempotency-Key`.

Components
- [ ] Filters: `selectLocation`, `selectDeviceStatus`, `selectShiftStatus`, `dateRangeShifts`.
- [ ] Tables: `tableDevices`, `tableShifts`.
- [ ] Drawers: `drawerDevice`, `drawerShiftOpen`, `drawerShiftClose`.
- [ ] Buttons: provision device, start shift, close shift.

Bindings
- [ ] Location change re-runs `qListDevices` and `qListShifts`.
- [ ] Status/date filters re-run the relevant list query.
- [ ] `tableShifts` row select -> `qGetShift`.
- [ ] Drawer submit -> write query -> refresh list + close drawer.

QA
- [ ] Provision a device and update status.
- [ ] Start and close a shift; confirm only one open shift per device.
- [ ] Filters change results as expected.

## App 4: Procurement and Trading Ops
Layout guide: `docs/retool-app4-procurement-layout.md`.

Queries
- [ ] Requests: `qListPurchaseRequests`, `qCreatePurchaseRequest`.
- [ ] Orders: `qListPurchaseOrders`, `qCreatePurchaseOrder`.
- [ ] Shipments: `qListImportShipments`, `qCreateImportShipment`.
- [ ] Actions: `qAddImportCosts`, `qReceiveImportShipment`, `qFinalizeImportShipment`.
- [ ] All write queries include `Idempotency-Key`.

Components
- [ ] Filters: `selectStatus`, `dateRangeProcurement`.
- [ ] Tables: `tableRequests`, `tableOrders`, `tableShipments`.
- [ ] Drawers: `drawerRequest`, `drawerOrder`, `drawerShipment`, `drawerImportCosts`, `drawerReceiveShipment`, `drawerFinalizeShipment`.
- [ ] Detail panel for shipment lines and costs.

Bindings
- [ ] Filters re-run list queries for the active tab.
- [ ] Drawer submit -> write query -> refresh list + close drawer.
- [ ] Shipment actions open the corresponding drawer.

QA
- [ ] Create request and order.
- [ ] Create shipment, add costs, receive, and finalize.
- [ ] Validate supplier/vendor IDs map to supplier type.

## App 5: Finance Ops
Layout guide: `docs/retool-app5-finance-layout.md`.

Queries
- [ ] COA: `qListCoa`, `qCreateCoa`.
- [ ] Cost centers: `qListCostCenters`, `qCreateCostCenter`.
- [ ] Periods: `qListPeriods`, `qCreatePeriod`.
- [ ] Journals: `qListJournals`, `qCreateJournal`.
- [ ] Agreements: `qCreateAgreement`, `qUpdateAgreement`.
- [ ] Exports: `qExportInvoices`, `qExportJournals`, `qExportPayments`.
- [ ] All write queries include `Idempotency-Key`.

Components
- [ ] Tables: `tableCoa`, `tableCostCenters`, `tablePeriods`, `tableJournals`.
- [ ] Drawers: `drawerCoa`, `drawerCostCenter`, `drawerPeriod`, `drawerJournal`, `drawerAgreement`.
- [ ] Export panel with buttons.

Bindings
- [ ] List queries run on load and refresh after create/update.
- [ ] Drawer submit -> write query -> refresh list + close drawer.
- [ ] Export buttons trigger export queries and show the download link.

QA
- [ ] Create COA, cost center, and fiscal period.
- [ ] Create journal entry with valid lines.
- [ ] Create or update intercompany agreement.
- [ ] Export CSV/JSON works for a date range.

## App 6: Payments Config and KYC
Layout guide: `docs/retool-app6-payments-config-layout.md`.

Queries
- [ ] List configs: `qListPaymentConfigs`.
- [ ] Update config: `qUpdatePaymentConfig`.
- [ ] Write queries include `Idempotency-Key`.

Components
- [ ] Filters: `selectEnvironment`, `selectProvider`, `selectSubsidiary`.
- [ ] Table: `tableConfigs`.
- [ ] Drawer: `drawerConfig`.

Bindings
- [ ] Filters re-run `qListPaymentConfigs`.
- [ ] Row select populates drawer fields.
- [ ] Drawer submit -> `qUpdatePaymentConfig` -> refresh list + close drawer.

QA
- [ ] Update settlement details and KYC contact info.
- [ ] Move status through draft -> submitted without validation errors.

## App 7: Reseller/Wholesale Portal (MVP)
Layout guide: `docs/retool-app7-reseller-wholesale-layout.md`.

Queries
- [ ] Resellers: `qListResellers`, `qCreateReseller` (Idempotency-Key).
- [ ] Credit: `qListCreditAccounts`, `qSetCreditLimit`, `qCreateRepayment` (Idempotency-Key).
- [ ] Reports: `qCreditReport`.
- [ ] Orders: `qListWholesaleOrders`, `qCreateWholesaleOrder`, `qFulfillWholesaleOrder` (Idempotency-Key).

Components
- [ ] Tabs: Resellers, Credit, Wholesale Orders.
- [ ] Tables: `tableResellers`, `tableCreditAccounts`, `tableWholesaleOrders`.
- [ ] Drawers: `drawerResellerCreate`, `drawerCreditLimit`, `drawerRepayment`, `drawerWholesaleOrder`.
- [ ] Panels: `panelResellerDetail`, `panelCreditReport`, `panelOrderDetail`.

Bindings
- [ ] Reseller select updates credit accounts + credit report.
- [ ] Drawer submit -> write query -> refresh list + close drawer.
- [ ] Order create -> refresh orders list; fulfill -> refresh selected order.
- [ ] Order create is disabled when available credit is insufficient and override is not enabled.

QA
- [ ] Create reseller and set credit limit.
- [ ] Record repayment and confirm report updates.
- [ ] Create and fulfill a wholesale order.
- [ ] Verify override toggle appears only with `credit.limit.override` permission.

## App 8: Audit Logs
Layout guide: `docs/retool-app8-audit-logs-layout.md`.

Queries
- [ ] Create list query: `qListAuditLogs`.

Components
- [ ] Filters: `dateRange`, `selectSubsidiary`, `selectAction`, `selectEntityType`, `selectActor`, `searchEntityId`.
- [ ] Table: `tableAuditLogs`.
- [ ] Detail panel: `panelAuditDetail`.

Bindings
- [ ] Filter changes re-run `qListAuditLogs`.
- [ ] Row select populates payload view.

QA
- [ ] Filter by `credit.limit.update` and confirm reason in payload.
