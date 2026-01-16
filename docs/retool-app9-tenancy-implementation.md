# Retool App 9: Tenancy & IAM Admin Implementation Steps

This guide covers the Tenancy & IAM Admin app build.

## Prerequisites
- Global helpers and headers from `docs/retool-admin-ops.md`.
- Permissions:
  - `tenancy.read`, `tenancy.subsidiaries.manage`, `tenancy.locations.manage`
  - `rbac.roles.manage`, `rbac.permissions.read`

## 1) App setup
1. Create a new Retool app: "Tenancy & IAM Admin".
2. Add filters: `selectGroup`, `selectSubsidiary`, `searchLocations`, `searchUsers`, `searchIamUsers`.
3. Add tabs: Groups, Subsidiaries, Locations, App Users, App Roles, IAM Users.

## 2) Queries
All queries use the REST resource and headers from `{{buildHeaders.value}}` unless noted.

Tenancy
- `qListTenantGroups` (GET `/tenant-groups`)
  - Tip: For SUPER_ADMIN/HOLDCO_ADMIN, allow an override to call without `X-Group-Id` to list all groups.
- `qListSubsidiaries` (GET `/tenants`)
- `qCreateSubsidiary` (POST `/subsidiaries`)
- `qListLocations` (GET `/locations`)
- `qCreateLocation` (POST `/locations`)

App users (DB)
- `qListAppUsers` (GET `/users`)
- `qCreateAppUser` (POST `/users`)
- `qAssignAppRole` (POST `/users/{{tableUsers.selectedRow.id}}/roles`)

Roles and permissions
- `qListRoles` (GET `/roles`)
- `qListPermissions` (GET `/permissions`)
- `qCreateRole` (POST `/roles`)
- `qUpdateRolePermissions` (POST `/roles/{{tableRoles.selectedRow.id}}/permissions`)

IAM (Keycloak)
- `qListIamUsers` (GET `/iam/users`)
- `qListIamRoles` (GET `/iam/roles`)
- `qAssignIamRoles` (POST `/iam/users/{{tableIamUsers.selectedRow.id}}/roles`)
- `qUpdateIamAttributes` (POST `/iam/users/{{tableIamUsers.selectedRow.id}}/attributes`)

All write queries should include `Idempotency-Key: {{newIdempotencyKey.value}}`.

## 3) Component wiring
- `selectGroup` changes -> refresh `qListSubsidiaries`, `qListLocations`, `qListAppUsers`.
- `selectSubsidiary` changes -> refresh `qListLocations`, `qListAppUsers`.
- Table row select -> populate drawers/forms for edits and assignments.
- Drawer submit -> write query -> refresh list + close drawer.

## 4) QA smoke tests
- Create a subsidiary and confirm a default location is created when enabled.
- Create a new location for the subsidiary.
- Create an app user and assign an app role.
- Update role permissions and confirm the new permission set.
- Assign IAM roles and update IAM user attributes (group/subsidiary/location).

## Notes
- App users are stored in the HoldCo DB (and drive API RBAC).
- IAM users are Keycloak accounts; use IAM attributes to scope group/subsidiary/location.
