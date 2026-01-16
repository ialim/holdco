# Retool App 9: Tenancy & IAM Admin Layout

This layout describes the Tenancy & IAM Admin app for managing groups, subsidiaries, locations, app users, and IAM users/roles.

## Page structure
- Header
  - Breadcrumb: Admin / Tenancy
  - Tenant group selector (visible to SUPER_ADMIN/HOLDCO_ADMIN)
  - Subsidiary selector (drives location + app user lists)
- Tabs
  - Groups
  - Subsidiaries
  - Locations
  - App Users
  - App Roles
  - IAM Users

## Wireframe (ASCII)
```
+----------------------------------------------------------------------------------+
| Admin / Tenancy   [Group] [Subsidiary]                                            |
+----------------------------------------------------------------------------------+
| Tabs: Groups | Subsidiaries | Locations | App Users | App Roles | IAM Users       |
|----------------------------------------------------------------------------------|
| Table (left)                               | Detail / Drawer (right)              |
| - list rows + filters                      | - create / edit forms                |
+----------------------------------------------------------------------------------+
```

## Component map (IDs -> queries)
- `selectGroup` -> `qListTenantGroups`
- `selectSubsidiary` -> `qListSubsidiaries`
- `tableGroups` -> `qListTenantGroups`
- `tableSubsidiaries` -> `qListSubsidiaries`
- `tableLocations` -> `qListLocations`
- `tableUsers` -> `qListAppUsers`
- `tableRoles` -> `qListRoles`
- `tableIamUsers` -> `qListIamUsers`

## Shared components
- Filters: `selectGroup`, `selectSubsidiary`, `searchLocations`, `searchUsers`, `searchIamUsers`.
- Tables: `tableGroups`, `tableSubsidiaries`, `tableLocations`, `tableUsers`, `tableRoles`, `tableIamUsers`.
- Drawers: `drawerSubsidiary`, `drawerLocation`, `drawerAppUser`, `drawerRole`, `drawerRolePermissions`, `drawerAssignRoles`.

## Table columns (recommended)
- Groups: `name`, `created_at`
- Subsidiaries: `name`, `role`, `status`
- Locations: `name`, `type`, `city`, `state`
- App Users: `email`, `name`, `status`, `roles`
- App Roles: `name`, `scope`
- IAM Users: `username`, `email`, `enabled`, `group_id`, `subsidiary_id`

## Query wiring (naming convention)
- Tenant groups: `qListTenantGroups` (GET `/tenant-groups`)
- Subsidiaries: `qListSubsidiaries` (GET `/tenants`)
- Locations: `qListLocations` (GET `/locations`)
- App users: `qListAppUsers` (GET `/users`)
- Roles/permissions: `qListRoles`, `qListPermissions`
- IAM users/roles: `qListIamUsers`, `qListIamRoles`

Each query should set headers to `{{buildHeaders.value}}` unless explicitly overridden (e.g., listing all groups).
