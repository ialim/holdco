# Retool Implementation Runbook

This runbook provides a consistent build sequence for the Phase 1 Retool apps using the checklist in `docs/retool-admin-ops-apps.md`.

See `docs/retool-app-build-checklists.md` for per-app ordered build steps.
Use `docs/retool-app-definition-of-done.md` to sign off each app.

## 1) Global setup
- Create a REST resource pointing to the API base URL.
- Add Retool state keys: `apiBaseUrl`, `jwt`, `groupId`, `subsidiaryId`, `locationId`, `channel`.
- Create helper transformers from `docs/retool-admin-ops.md`:
  - `buildHeaders`
  - `newIdempotencyKey`
- Set defaults for `channel` (`retail`) and `apiBaseUrl` (`http://localhost:3000/v1`).

## 2) Shared UI components
- Standard data table with:
  - Search input (`q`)
  - Pagination (`limit`, `offset`)
  - Status filter when supported
- Standard form drawer (create/edit) with:
  - Validation rules from `docs/retool-admin-ops-apps.md`
  - Save and Cancel buttons
- Standard toast notifications:
  - Success: “Saved”
  - Error: show server error message

## 3) Query patterns
- List queries use the table state for pagination and filters.
- Create/update queries use `newIdempotencyKey` and refresh the list query on success.
- Detail panels should load when a row is selected.

## 4) App build order
1. Catalog Admin
2. Orders & Payments Ops
3. POS Operations
4. Procurement & Trading Ops
5. Finance Ops
6. Payments Config & KYC

## 5) Access control
- Gate apps by role and permission (see `docs/rbac-policies.md`).
- If using Retool groups, align group access to backend permissions.

## 6) Validation and QA
- Verify list queries return data with correct tenant scoping.
- Validate create and update payloads using backend validation errors.
- Confirm idempotency behavior on write retries (409 treated as success).

## 7) Deployment checklist
- Update resource base URL for staging/production.
- Rotate JWT secrets and credentials for Retool resource.
- Export Retool apps for backup/versioning.
