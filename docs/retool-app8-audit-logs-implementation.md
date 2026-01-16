# Retool App 8: Audit Logs Implementation Steps

This is a step-by-step build guide for the Audit Logs viewer. It complements:
- Layout: `docs/retool-app8-audit-logs-layout.md`
- Checklist: `docs/retool-admin-ops-apps.md`

## Prerequisites
- Global helpers and headers from `docs/retool-admin-ops.md`.
- Permission: `audit.logs.read`.

## 1) App setup
1. Create a new Retool app: "Audit Logs".
2. Add filters: `dateRange`, `selectSubsidiary`, `selectAction`, `selectEntityType`, `selectActor`, `searchEntityId`.
3. Optional: add `searchActorEmail` if you prefer free-text actor filtering.

## 2) Queries
All queries use the REST resource and headers from `{{buildHeaders.value}}`.

`qListAuditLogs` (GET `/audit-logs`)
- Params:
  - `limit`: `{{tableAuditLogs.pageSize}}`
  - `offset`: `{{tableAuditLogs.pageOffset}}`
  - `subsidiary_id`: `{{selectSubsidiary.value}}`
  - `actor_id`: `{{selectActor.value}}`
  - `actor_email`: `{{searchActorEmail.value}}`
  - `entity_id`: `{{searchEntityId.value}}`
  - `entity_type`: `{{selectEntityType.value}}`
  - `action`: `{{selectAction.value}}`
  - `start_date`: `{{dateRange.value.start}}`
  - `end_date`: `{{dateRange.value.end}}`

`qListAuditActions` (GET `/audit-logs/actions`)
- Params:
  - `limit`: `200`
  - `offset`: `0`
  - `q`: `{{searchAction.value}}`

`qListAuditEntityTypes` (GET `/audit-logs/entity-types`)
- Params:
  - `limit`: `200`
  - `offset`: `0`
  - `q`: `{{searchEntityType.value}}`

`qListAuditActors` (GET `/audit-logs/actors`)
- Params:
  - `limit`: `200`
  - `offset`: `0`
  - `q`: `{{searchActor.value}}`

## 3) Component wiring
- Filter changes -> re-run `qListAuditLogs`.
- `tableAuditLogs` row select -> populate `panelAuditDetail`.
- Detail panel shows payload JSON and highlights credit limit changes.
- `selectAction`, `selectEntityType`, `selectActor` option lists come from the lookup queries.

Suggested table columns:
- `created_at` (format: `YYYY-MM-DD HH:mm`).
- `action`
- `entity_type`
- `entity_id`
- `actor.email`
- `subsidiary_id`

## 4) QA smoke tests
- Filter by action `credit.limit.update` and confirm payload includes `reason`.
- Filter by reseller entity id and see only matching logs.
- Date range filter reduces the dataset.
