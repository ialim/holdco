# Retool App 4: Procurement and Trading Ops Implementation Steps

This is a step-by-step build guide for Procurement and Trading Ops. It complements:
- Layout: `docs/retool-app4-procurement-layout.md`
- Checklist: `docs/retool-admin-ops-apps.md`

## Prerequisites
- Global helpers and headers from `docs/retool-admin-ops.md`.
- Permissions: `procurement.request.manage`, `procurement.order.manage`, `procurement.imports.manage`.
- Supplier/vendor IDs should map to suppliers (ExternalClient of type supplier).

## 1) App setup
1. Create a new Retool app: "Procurement & Trading Ops".
2. Add global state keys if missing: `groupId`, `subsidiaryId`, `locationId`, `channel`, `jwt`.
3. Add filters: `selectStatus`, `dateRangeProcurement`.

## 2) Queries
All queries use the REST resource and headers from `{{buildHeaders.value}}`.
All write queries include `Idempotency-Key: {{newIdempotencyKey.value}}`.

### Purchase Requests
`qListPurchaseRequests` (GET `/procurement/purchase-requests`)
- Params: `limit`, `offset`, `status`, `start_date`, `end_date`, `q`.

`qCreatePurchaseRequest` (POST `/procurement/purchase-requests`)
- Body:
```json
{
  "requester_id": "{{selectRequester.value}}",
  "needed_by": "{{inputNeededBy.value}}",
  "notes": "{{inputRequestNotes.value}}",
  "items": {{tableRequestItems.data || []}}
}
```

### Purchase Orders
`qListPurchaseOrders` (GET `/procurement/purchase-orders`)
- Params: `limit`, `offset`, `status`, `start_date`, `end_date`, `q`.

`qCreatePurchaseOrder` (POST `/procurement/purchase-orders`)
- Body:
```json
{
  "vendor_id": "{{selectVendor.value}}",
  "ordered_at": "{{inputOrderedAt.value}}",
  "expected_at": "{{inputExpectedAt.value}}",
  "currency": "{{inputOrderCurrency.value}}",
  "items": {{tableOrderItems.data || []}}
}
```

### Import Shipments
`qListImportShipments` (GET `/procurement/import-shipments`)
- Params: `limit`, `offset`, `status`, `start_date`, `end_date`, `q`.

`qCreateImportShipment` (POST `/procurement/import-shipments`)
- Body:
```json
{
  "reference": "{{inputShipmentReference.value}}",
  "supplier_id": "{{selectShipmentSupplier.value}}",
  "currency": "{{inputShipmentCurrency.value}}",
  "fx_rate": {{inputFxRate.value}},
  "arrival_date": "{{inputArrivalDate.value}}",
  "lines": {{tableShipmentLines.data || []}}
}
```

`qAddImportCosts` (POST `/procurement/import-shipments/{{tableShipments.selectedRow.id}}/costs`)
- Body:
```json
{ "costs": {{tableImportCosts.data || []}} }
```

`qReceiveImportShipment` (POST `/procurement/import-shipments/{{tableShipments.selectedRow.id}}/receive`)
- Body:
```json
{
  "location_id": "{{selectReceiveLocation.value}}",
  "received_at": "{{inputReceivedAt.value}}",
  "notes": "{{inputReceiveNotes.value}}",
  "lines": {{tableReceiveLines.data || []}}
}
```

`qFinalizeImportShipment` (POST `/procurement/import-shipments/{{tableShipments.selectedRow.id}}/finalize`)
- No body.

## 3) Component wiring
- `selectStatus` and `dateRangeProcurement` changes -> re-run the list query for the active tab.
- Drawer submit -> write query -> refresh list + close drawer.
- Shipment actions open their respective drawers.

## 4) QA smoke tests
- Create a purchase request and a purchase order.
- Create an import shipment with lines.
- Add costs, receive, and finalize the shipment.
- Verify status transitions and list updates.
