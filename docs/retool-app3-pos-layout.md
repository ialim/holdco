# Retool App 3: POS Operations Layout

This layout describes the page structure, components, and query wiring for POS Operations. It assumes the global helpers in `docs/retool-admin-ops.md` and query checklist in `docs/retool-admin-ops-apps.md`.

## Page structure
- Header
  - Breadcrumb: Ops / POS
  - Location selector (required)
  - Device status filter (active/inactive/retired)
  - Shift status filter (open/closed)
  - Date range (for shifts)
- Tabs
  - Devices
  - Shifts

## Wireframe (ASCII)
```
+----------------------------------------------------------------------------------+
| Ops / POS        [Location] [Device Status] [Shift Status] [Date Range]          |
+----------------------------------------------------------------------------------+
| Tabs: [Devices] [Shifts]                                                         |
+----------------------------------------------------------------------------------+
| Devices Tab:                                                                     |
|  [Search Devices........] [Provision Device]                                     |
|  +--------------------------------------------------------------------------+    |
|  | Devices Table (device_id, status, last_seen, location, metadata)         |    |
|  +--------------------------------------------------------------------------+    |
|  Drawer: Device (name, status, location_id, metadata)                            |
|                                                                                  |
| Shifts Tab:                                                                      |
|  [Status] [Date Range] [Start Shift]                                             |
|  +--------------------------------------------------------------------------+    |
|  | Shifts Table (device, opened_at, closed_at, floats, operator)             |    |
|  +--------------------------------------------------------------------------+    |
|  Drawer: Open Shift / Close Shift                                                |
+----------------------------------------------------------------------------------+
```

## Component map (IDs -> queries)
- `selectLocation` -> re-run `qListDevices` and `qListShifts`
- `searchDevices`, `selectDeviceStatus` -> re-run `qListDevices`
- `selectShiftStatus`, `dateRangeShifts` -> re-run `qListShifts`
- `tableDevices` -> data: `qListDevices`
- `drawerDevice` submit -> `qProvisionDevice` or `qUpdateDevice`
- `tableShifts` -> data: `qListShifts`, row select -> `qGetShift`
- `drawerShiftOpen` submit -> `qStartShift`
- `drawerShiftClose` submit -> `qCloseShift`

## Shared components
- Location select: `selectLocation`
- Device search input: `searchDevices`
- Shift date range: `dateRangeShifts`
- Tables: `tableDevices`, `tableShifts`
- Drawers: `drawerDevice`, `drawerShiftOpen`, `drawerShiftClose`
- Toasts for success/error

## Query wiring (naming convention)
- List devices: `qListDevices`
- Provision device: `qProvisionDevice`
- Update device: `qUpdateDevice`
- List shifts: `qListShifts`
- Get shift: `qGetShift`
- Start shift: `qStartShift`
- Close shift: `qCloseShift`

Each query should set headers to `{{buildHeaders.value}}`.
Create/update queries must set `Idempotency-Key: {{newIdempotencyKey.value}}`.

## Tab layout and wiring

### Devices tab
- Components:
  - `searchDevices`
  - `selectDeviceStatus`
  - `btnProvisionDevice`
  - `tableDevices`
  - `drawerDevice`
- Wiring:
  - `qListDevices` runs on load and when location/status/search changes.
  - `btnProvisionDevice` opens `drawerDevice` in create mode.
  - Row select populates `drawerDevice` for edit.
  - Submit -> `qProvisionDevice` or `qUpdateDevice`, then refresh `qListDevices`.

### Shifts tab
- Components:
  - `selectShiftStatus`
  - `dateRangeShifts`
  - `btnStartShift`
  - `tableShifts`
  - `drawerShiftOpen`
  - `drawerShiftClose`
- Wiring:
  - `qListShifts` runs on load and when location/status/date changes.
  - `btnStartShift` opens `drawerShiftOpen` (requires device id).
  - Row select -> `qGetShift` (optional) -> show detail panel.
  - Close action opens `drawerShiftClose`, submit -> `qCloseShift` -> refresh `qListShifts`.

## Validation rules (summary)
- Device: `device_id` required, `location_id` required, status enum optional, metadata JSON optional.
- Start shift: `device_id` required, `opening_float` >= 0 optional, `opened_by_id` optional.
- Close shift: `closing_float` >= 0 optional, `closed_by_id` optional.

## Recommended defaults
- `selectDeviceStatus` default: blank (all).
- `selectShiftStatus` default: open.
- `dateRangeShifts` default: last 7 days.
