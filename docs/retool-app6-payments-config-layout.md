# Retool App 6: Payments Config and KYC Layout

This layout describes the page structure, components, and query wiring for Payments Config and KYC. It assumes the global helpers in `docs/retool-admin-ops.md` and query checklist in `docs/retool-admin-ops-apps.md`.

## Page structure
- Header
  - Breadcrumb: Ops / Payments Config
  - Environment toggle (test/live)
  - Provider filter (paystack/flutterwave/monnify/interswitch)
  - Subsidiary selector (optional)
- Main
  - Configs table
  - Detail panel + edit drawer

## Wireframe (ASCII)
```
+----------------------------------------------------------------------------------+
| Ops / Payments Config   [Environment] [Provider] [Subsidiary]                    |
+----------------------------------------------------------------------------------+
| +-----------------------------+  +-------------------------------------------+  |
| | Configs Table               |  | Detail Panel                              |  |
| | (subsidiary, provider, env, |  | - Settlement details                       |  |
| |  status)                    |  | - KYC contact + status                      |  |
| +-----------------------------+  +-------------------------------------------+  |
|                                 Drawer: Edit Config (settlement, KYC, notes)   |
+----------------------------------------------------------------------------------+
```

## Component map (IDs -> queries)
- `selectEnvironment`, `selectProvider`, `selectSubsidiary` -> re-run `qListPaymentConfigs`
- `tableConfigs` -> data: `qListPaymentConfigs`
- `drawerConfig` submit -> `qUpdatePaymentConfig`

## Shared components
- Filters: `selectEnvironment`, `selectProvider`, `selectSubsidiary`
- Table: `tableConfigs`
- Drawer: `drawerConfig`
- Status pill or timeline component
- Toasts for success/error

## Query wiring (naming convention)
- List configs: `qListPaymentConfigs`
- Update config: `qUpdatePaymentConfig`

Each query should set headers to `{{buildHeaders.value}}`.
Update requests must set `Idempotency-Key: {{newIdempotencyKey.value}}`.

## Component wiring
- `qListPaymentConfigs` runs on load and when filters change.
- Row select populates detail panel and `drawerConfig` form.
- Submit -> `qUpdatePaymentConfig` -> refresh `qListPaymentConfigs`.

## Field groups (layout guidance)
- Subsidiary + provider + environment (read-only identifiers).
- Settlement details (account name/number/bank/currency).
- KYC contact details (name/email/phone).
- KYC status (draft/submitted/approved/rejected) with timestamps.
- Notes (free text).

## Validation rules (summary)
- Provider, environment, subsidiary_id required (read-only if already created).
- Settlement account number and bank name required before moving status to submitted.
- Contact email must be valid if provided.

## Recommended defaults
- Environment default: test.
- Provider default: paystack.
