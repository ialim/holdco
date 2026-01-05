# Retool App 5: Finance Ops Layout

This layout describes the page structure, components, and query wiring for Finance Ops. It assumes the global helpers in `docs/retool-admin-ops.md` and query checklist in `docs/retool-admin-ops-apps.md`.

## Page structure
- Header
  - Breadcrumb: Ops / Finance
  - Fiscal period selector (optional)
- Tabs
  - Chart of Accounts
  - Cost Centers
  - Fiscal Periods
  - Journal Entries
  - Intercompany Agreements
  - Exports

## Wireframe (ASCII)
```
+----------------------------------------------------------------------------------+
| Ops / Finance        [Fiscal Period]                                             |
+----------------------------------------------------------------------------------+
| Tabs: [COA] [Cost Centers] [Periods] [Journals] [Agreements] [Exports]           |
+----------------------------------------------------------------------------------+
| COA:                                                                             |
|  [Create COA]                                                                    |
|  +--------------------------------------------------------------------------+    |
|  | COA Table (code, name, type, parent)                                     |    |
|  +--------------------------------------------------------------------------+    |
|  Drawer: COA (code, name, type, parent)                                        |
|                                                                                  |
| Cost Centers / Periods / Journals: similar table + drawer pattern               |
|                                                                                  |
| Agreements:                                                                      |
|  Form (provider, recipient, type, pricing_model, rates)                         |
|                                                                                  |
| Exports:                                                                         |
|  [Start Date] [End Date] [Format]                                                |
|  Buttons: Export Invoices / Journals / Payments                                  |
+----------------------------------------------------------------------------------+
```

## Component map (IDs -> queries)
- `tableCoa` -> data: `qListCoa`
- `drawerCoa` submit -> `qCreateCoa`
- `tableCostCenters` -> data: `qListCostCenters`
- `drawerCostCenter` submit -> `qCreateCostCenter`
- `tablePeriods` -> data: `qListPeriods`
- `drawerPeriod` submit -> `qCreatePeriod`
- `tableJournals` -> data: `qListJournals`
- `drawerJournal` submit -> `qCreateJournal`
- `drawerAgreement` submit -> `qCreateAgreement` or `qUpdateAgreement`
- `btnExportInvoices` -> `qExportInvoices`
- `btnExportJournals` -> `qExportJournals`
- `btnExportPayments` -> `qExportPayments`

## Shared components
- Tables: `tableCoa`, `tableCostCenters`, `tablePeriods`, `tableJournals`
- Drawers: `drawerCoa`, `drawerCostCenter`, `drawerPeriod`, `drawerJournal`, `drawerAgreement`
- Export panel: `panelExports`
- Toasts for success/error

## Query wiring (naming convention)
- List COA: `qListCoa`
- Create COA: `qCreateCoa`
- List cost centers: `qListCostCenters`
- Create cost center: `qCreateCostCenter`
- List fiscal periods: `qListPeriods`
- Create fiscal period: `qCreatePeriod`
- List journals: `qListJournals`
- Create journal: `qCreateJournal`
- Create agreement: `qCreateAgreement`
- Update agreement: `qUpdateAgreement`
- Export invoices: `qExportInvoices`
- Export journals: `qExportJournals`
- Export payments: `qExportPayments`

Each query should set headers to `{{buildHeaders.value}}`.
Create/update queries must set `Idempotency-Key: {{newIdempotencyKey.value}}`.

## Tab layout and wiring

### Chart of Accounts tab
- Components:
  - `tableCoa`
  - `btnCreateCoa`
  - `drawerCoa`
- Wiring:
  - `qListCoa` runs on load.
  - `btnCreateCoa` opens `drawerCoa`.
  - Submit -> `qCreateCoa` -> refresh `qListCoa`.

### Cost Centers tab
- Components:
  - `tableCostCenters`
  - `btnCreateCostCenter`
  - `drawerCostCenter`
- Wiring:
  - `qListCostCenters` runs on load.
  - Submit -> `qCreateCostCenter` -> refresh list.

### Fiscal Periods tab
- Components:
  - `tablePeriods`
  - `btnCreatePeriod`
  - `drawerPeriod`
- Wiring:
  - `qListPeriods` runs on load.
  - Submit -> `qCreatePeriod` -> refresh list.

### Journal Entries tab
- Components:
  - `tableJournals`
  - `btnCreateJournal`
  - `drawerJournal`
- Wiring:
  - `qListJournals` runs on load and when fiscal period filter changes.
  - Submit -> `qCreateJournal` -> refresh list.

### Intercompany Agreements tab
- Components:
  - `drawerAgreement`
  - `btnCreateAgreement`
  - `btnUpdateAgreement`
- Wiring:
  - Create -> `qCreateAgreement`.
  - Update uses `qUpdateAgreement` with selected agreement id.

### Exports tab
- Components:
  - Date range filters and format selector.
  - Buttons: Export Invoices, Export Journals, Export Payments.
- Wiring:
  - Buttons trigger `qExportInvoices`, `qExportJournals`, `qExportPayments`.
  - Display download link from response.

## Validation rules (summary)
- COA: code + name required, type enum required.
- Cost center: code + name required.
- Fiscal period: name + start/end dates required.
- Journal entry: fiscal_period_id required, lines array min 1, debit or credit per line.
- Intercompany agreement: provider/recipient, type, pricing model, effective_from required.

## Recommended defaults
- COA page size: 100.
- Fiscal period selector default: latest open period.
