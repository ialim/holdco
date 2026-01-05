# Retool App 4: Procurement and Trading Ops Layout

This layout describes the page structure, components, and query wiring for Procurement and Trading Ops. It assumes the global helpers in `docs/retool-admin-ops.md` and query checklist in `docs/retool-admin-ops-apps.md`.

## Page structure
- Header
  - Breadcrumb: Ops / Procurement
  - Status filter
  - Date range (optional)
- Tabs
  - Purchase Requests
  - Purchase Orders
  - Import Shipments

## Wireframe (ASCII)
```
+----------------------------------------------------------------------------------+
| Ops / Procurement   [Status] [Date Range]                                        |
+----------------------------------------------------------------------------------+
| Tabs: [Purchase Requests] [Purchase Orders] [Import Shipments]                   |
+----------------------------------------------------------------------------------+
| Purchase Requests:                                                               |
|  [Create Request]                                                                |
|  +--------------------------------------------------------------------------+    |
|  | Requests Table (status, requester, items, needed_by)                      |    |
|  +--------------------------------------------------------------------------+    |
|  Drawer: Request (items, needed_by, notes)                                     |
|                                                                                  |
| Purchase Orders:                                                                 |
|  [Create Order]                                                                  |
|  +--------------------------------------------------------------------------+    |
|  | Orders Table (status, vendor, total, expected_at)                          |    |
|  +--------------------------------------------------------------------------+    |
|  Drawer: Order (vendor_id, items, currency)                                      |
|                                                                                  |
| Import Shipments:                                                                |
|  [Create Shipment]                                                               |
|  +--------------------------------------------------------------------------+    |
|  | Shipments Table (reference, status, currency, arrival_date)               |    |
|  +--------------------------------------------------------------------------+    |
|  Detail Panel: Lines + Costs                                                     |
|  Actions: [Add Costs] [Receive] [Finalize]                                       |
+----------------------------------------------------------------------------------+
```

## Component map (IDs -> queries)
- `selectStatus`, `dateRangeProcurement` -> re-run list queries for current tab
- `tableRequests` -> data: `qListPurchaseRequests`
- `drawerRequest` submit -> `qCreatePurchaseRequest`
- `tableOrders` -> data: `qListPurchaseOrders`
- `drawerOrder` submit -> `qCreatePurchaseOrder`
- `tableShipments` -> data: `qListImportShipments`
- `drawerShipment` submit -> `qCreateImportShipment`
- `drawerImportCosts` submit -> `qAddImportCosts`
- `drawerReceiveShipment` submit -> `qReceiveImportShipment`
- `drawerFinalizeShipment` submit -> `qFinalizeImportShipment`

## Shared components
- Status dropdown: `selectStatus`
- Date range: `dateRangeProcurement`
- Tables: `tableRequests`, `tableOrders`, `tableShipments`
- Drawers: `drawerRequest`, `drawerOrder`, `drawerShipment`
- Action drawers: `drawerImportCosts`, `drawerReceiveShipment`, `drawerFinalizeShipment`
- Toasts for success/error

## Query wiring (naming convention)
- List requests: `qListPurchaseRequests`
- Create request: `qCreatePurchaseRequest`
- List orders: `qListPurchaseOrders`
- Create order: `qCreatePurchaseOrder`
- List shipments: `qListImportShipments`
- Create shipment: `qCreateImportShipment`
- Add costs: `qAddImportCosts`
- Receive shipment: `qReceiveImportShipment`
- Finalize shipment: `qFinalizeImportShipment`

Each query should set headers to `{{buildHeaders.value}}`.
Create/update queries must set `Idempotency-Key: {{newIdempotencyKey.value}}`.

## Tab layout and wiring

### Purchase Requests tab
- Components:
  - `selectStatus`
  - `btnCreateRequest`
  - `tableRequests`
  - `drawerRequest`
- Wiring:
  - `qListPurchaseRequests` runs on load and when status/date changes.
  - `btnCreateRequest` opens `drawerRequest`.
  - Submit -> `qCreatePurchaseRequest` -> refresh `qListPurchaseRequests`.

### Purchase Orders tab
- Components:
  - `selectStatus`
  - `btnCreateOrder`
  - `tableOrders`
  - `drawerOrder`
- Wiring:
  - `qListPurchaseOrders` runs on load and when status/date changes.
  - `btnCreateOrder` opens `drawerOrder`.
  - Submit -> `qCreatePurchaseOrder` -> refresh `qListPurchaseOrders`.

### Import Shipments tab
- Components:
  - `selectStatus`
  - `btnCreateShipment`
  - `tableShipments`
  - `drawerShipment`
  - `drawerImportCosts`
  - `drawerReceiveShipment`
  - `drawerFinalizeShipment`
- Wiring:
  - `qListImportShipments` runs on load and when status/date changes.
  - `btnCreateShipment` opens `drawerShipment`.
  - Row select shows shipment detail panel with lines and costs.
  - Actions:
    - Add costs -> open `drawerImportCosts` -> `qAddImportCosts` -> refresh list.
    - Receive -> open `drawerReceiveShipment` -> `qReceiveImportShipment` -> refresh list.
    - Finalize -> open `drawerFinalizeShipment` -> `qFinalizeImportShipment` -> refresh list.

## Validation rules (summary)
- Purchase request: items array min 1, quantity >= 1.
- Purchase order: vendor_id required, items array min 1, unit_price >= 0.
- Import shipment: reference required, currency required, fx_rate >= 0, lines array min 1.
- Import costs: each line has category + amount >= 0.
- Receive shipment: location_id required, quantities >= 0.

## Recommended defaults
- Status filter default: blank (all).
- Date range default: last 30 days.
