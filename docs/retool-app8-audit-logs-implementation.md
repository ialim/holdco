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

## 2) Queries
All queries use the REST resource and headers from `{{buildHeaders.value}}`.

`qListAuditLogs` (GET `/audit-logs`)
- Params: `limit`, `offset`, `subsidiary_id`, `actor_id`, `entity_id`, `entity_type`, `action`, `start_date`, `end_date`.

## 3) Component wiring
- Filter changes -> re-run `qListAuditLogs`.
- `tableAuditLogs` row select -> populate `panelAuditDetail`.
- Detail panel shows payload JSON and highlights credit limit changes.

## 4) QA smoke tests
- Filter by action `credit.limit.update` and confirm payload includes `reason`.
- Filter by reseller entity id and see only matching logs.
- Date range filter reduces the dataset.
