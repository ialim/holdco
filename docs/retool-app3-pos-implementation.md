# Retool App 3: POS Operations Implementation Steps

This is a step-by-step build guide for the POS Operations Retool app. It complements:
- Layout: `docs/retool-app3-pos-layout.md`
- Checklist: `docs/retool-admin-ops-apps.md`

## Prerequisites
- Global helpers and headers from `docs/retool-admin-ops.md`.
- User has permissions: `pos.devices.read`, `pos.devices.manage`, `pos.shifts.read`, `pos.shifts.manage`.
- `locationId` state must be set for shift actions (`X-Location-Id` header is required).
- Use `channel = admin_ops` for device provisioning queries (POS channel requests are rejected).

## 1) App setup
1. Create a new Retool app: "POS Operations".
2. Add state keys (if not already global): `groupId`, `subsidiaryId`, `locationId`, `channel`, `jwt`.
3. Add a Location selector (`selectLocation`).
   - Options: `{{qListLocations.data.data.map((loc) => ({ label: loc.name, value: loc.id }))}}`
   - Value: location UUID.

## 2) Queries
All queries use the REST resource "HoldCo API" and headers from `{{buildHeaders.value}}`.
All write queries include `Idempotency-Key: {{newIdempotencyKey.value}}`.

### Locations
`qListLocations` (GET `/locations`)
- Params:
  - `subsidiary_id`: `{{subsidiaryId}}`
  - `limit`: `{{50}}`

### Devices
`qListDevices` (GET `/pos/devices`)
- Params:
  - `subsidiary_id`: `{{subsidiaryId}}`
  - `location_id`: `{{selectLocation.value}}`
  - `q`: `{{searchDevices.value}}`
  - `status`: `{{selectDeviceStatus.value}}`
  - `limit`: `{{tableDevices.pageSize || 50}}`
  - `offset`: `{{tableDevices.offset || 0}}`

`qProvisionDevice` (POST `/pos/devices`)
- Headers override:
  - `X-Channel`: `admin_ops`
- Body:
```json
{
  "device_id": "{{inputDeviceId.value}}",
  "location_id": "{{selectLocation.value}}",
  "name": "{{inputDeviceName.value}}",
  "status": "{{selectDeviceStatusForm.value}}",
  "metadata": {{inputDeviceMetadata.value || "{}"}}
}
```

`qUpdateDevice` (PATCH `/pos/devices/{{tableDevices.selectedRow.device_id}}`)
- Headers override:
  - `X-Channel`: `admin_ops`
- Create a transformer `deviceUpdatePayload`:
```js
const payload = {};
if (selectLocationEdit.value) payload.location_id = selectLocationEdit.value;
if (inputDeviceNameEdit.value !== "") payload.name = inputDeviceNameEdit.value;
if (selectDeviceStatusEdit.value) payload.status = selectDeviceStatusEdit.value;
if (inputDeviceMetadataEdit.value) payload.metadata = inputDeviceMetadataEdit.value;
return payload;
```
- Body: `{{deviceUpdatePayload.value}}`

### Shifts
`qListShifts` (GET `/pos/shifts`)
- Params:
  - `subsidiary_id`: `{{subsidiaryId}}`
  - `location_id`: `{{selectLocation.value}}`
  - `status`: `{{selectShiftStatus.value}}`
  - `start_date`: `{{dateRangeShifts.start}}`
  - `end_date`: `{{dateRangeShifts.end}}`
  - `device_id`: `{{searchShiftDevice.value}}` (optional)
  - `limit`: `{{tableShifts.pageSize || 50}}`
  - `offset`: `{{tableShifts.offset || 0}}`

`qGetShift` (GET `/pos/shifts/{{tableShifts.selectedRow.id}}`)

`qStartShift` (POST `/pos/shifts`)
- Body:
```json
{
  "device_id": "{{inputShiftDeviceId.value}}",
  "opening_float": {{inputOpeningFloat.value || 0}},
  "opened_by_id": "{{selectOpenedBy.value}}",
  "notes": "{{inputShiftNotes.value}}"
}
```

`qCloseShift` (POST `/pos/shifts/{{tableShifts.selectedRow.id}}/close`)
- Body:
```json
{
  "closing_float": {{inputClosingFloat.value || 0}},
  "closed_by_id": "{{selectClosedBy.value}}",
  "notes": "{{inputCloseNotes.value}}"
}
```

## 3) Component inventory (IDs + bindings)
- `selectLocation`: options from `qListLocations.data.data`; value is a location UUID.
- `selectDeviceStatus`: dropdown `active | inactive | retired`.
- `selectShiftStatus`: dropdown `open | closed`.
- `dateRangeShifts`: start/end ISO dates.
- `tableDevices`
  - Data: `{{qListDevices.data.data}}`
  - Server pagination total: `{{qListDevices.data.meta.total}}`
  - Columns: `device_id`, `name`, `status`, `last_seen_at`, `location_id`
- `tableShifts`
  - Data: `{{qListShifts.data.data}}`
  - Server pagination total: `{{qListShifts.data.meta.total}}`
  - Columns: `device_id`, `status`, `opened_at`, `closed_at`, `opening_float`, `closing_float`, `opened_by_id`
- `drawerDevice`: inputs `inputDeviceId`, `inputDeviceName`, `selectDeviceStatusForm`, `inputDeviceMetadata`.
- `drawerShiftOpen`: inputs `inputShiftDeviceId`, `inputOpeningFloat`, `selectOpenedBy`, `inputShiftNotes`.
- `drawerShiftClose`: inputs `inputClosingFloat`, `selectClosedBy`, `inputCloseNotes`.

## 4) Component wiring
- On app load: run `qListLocations`.
- On `selectLocation` change:
  - `locationId.setValue(selectLocation.value)`
  - run `qListDevices` and `qListShifts`.
- `searchDevices` or `selectDeviceStatus` change -> re-run `qListDevices`.
- `selectShiftStatus` or `dateRangeShifts` change -> re-run `qListShifts`.
- `tableDevices` binds to `qListDevices.data.data`.
- `tableShifts` binds to `qListShifts.data.data`.
- Drawer submits:
  - Provision -> `qProvisionDevice` -> refresh `qListDevices`.
  - Update -> `qUpdateDevice` -> refresh `qListDevices`.
  - Start shift -> `qStartShift` -> refresh `qListShifts`.
  - Close shift -> `qCloseShift` -> refresh `qListShifts`.

## 5) QA smoke tests
- Provision a device for the selected location.
- Update device status to inactive.
- Start a shift for the device; confirm it appears as open.
- Attempt to start a second shift for the same device (expect error toast).
- Close the shift; confirm status is closed and close details are visible.
