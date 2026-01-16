# Retool App 8: Audit Logs Layout

This layout describes the Audit Logs viewer for Admin/Ops. It relies on `docs/retool-admin-ops.md` for global helpers and `docs/retool-admin-ops-apps.md` for query checklist.

## Page structure
- Header
  - Breadcrumb: Admin / Audit Logs
  - Date range filter
  - Subsidiary filter (optional)
  - Action, entity type, and actor filters (from lookup queries)
- Main split
  - Left: Audit log table
  - Right: Detail panel (payload)

## Wireframe (ASCII)
```
+----------------------------------------------------------------------------------+
| Admin / Audit Logs   [Date Range] [Subsidiary] [Action] [Entity Type] [Actor]    |
+----------------------------------------------------------------------------------+
| +-------------------------------+  +-----------------------------------------+  |
| | Audit Logs Table              |  | Detail Panel                            |  |
| | (created_at, action, entity)  |  | - Actor + entity summary                |  |
| | (subsidiary, actor_email)     |  | - Payload JSON                          |  |
| +-------------------------------+  +-----------------------------------------+  |
+----------------------------------------------------------------------------------+
```

## Component map (IDs -> queries)
- `dateRange`, `selectSubsidiary`, `selectAction`, `selectEntityType`, `selectActor`, `searchEntityId` -> `qListAuditLogs`
- `selectAction` options -> `qListAuditActions`
- `selectEntityType` options -> `qListAuditEntityTypes`
- `selectActor` options -> `qListAuditActors`
- `tableAuditLogs` -> `qListAuditLogs`
- `panelAuditDetail` -> bound to `tableAuditLogs.selectedRow`

## Shared components
- Filters: `dateRange`, `selectSubsidiary`, `selectAction`, `selectEntityType`, `selectActor`, `searchEntityId`
- Table: `tableAuditLogs`
- Detail panel: `panelAuditDetail`

## Table columns (recommended)
- `created_at`
- `action`
- `entity_type`
- `entity_id`
- `actor.email`
- `subsidiary_id`

## Query wiring (naming convention)
- List audit logs: `qListAuditLogs` (GET `/audit-logs`)

Each query should set headers to `{{buildHeaders.value}}`.
