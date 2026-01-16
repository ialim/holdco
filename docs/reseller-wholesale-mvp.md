# Reseller/Wholesale Portal MVP

## Purpose
Define the minimum viable scope for the Reseller/Wholesale channel app so we can split it from Admin/Ops without duplicating core backend logic.

## Target Users
- Wholesale sales reps
- Reseller account managers
- Credit/collections analysts

## Goals (MVP)
- Onboard resellers and set credit limits.
- Create wholesale orders on behalf of resellers.
- Track invoices and repayments against credit accounts.
- Provide a simple statements view (balance, limits, aging).

## Non-Goals (MVP)
- Retail POS workflows (checkout, shift, device provisioning).
- Deep finance operations (journals, tax filings, intercompany).
- Warehouse-specific flows (pick/pack, delivery routing).

## Core Workflows
1) Reseller onboarding + credit setup
   - Create reseller
   - Create credit account
   - Set credit limit and payment terms

2) Wholesale order creation
   - Search catalog + pricing
   - Create wholesale order
   - Fulfill order (status progression)

3) Repayment recording
   - Record repayment against credit account
   - Update balance and aging

4) Statements
   - View credit balance, limits, due dates, repayments

## Data Sources (API)
- Resellers
  - GET/POST `/v1/resellers`
- Credit accounts + limits + repayments
  - GET/POST `/v1/credit-accounts`
  - POST `/v1/credit-limits`
  - POST `/v1/adapters/credit/repayments`
- Wholesale orders
  - POST `/v1/adapters/wholesale/orders`
  - POST `/v1/adapters/wholesale/orders/{order_id}/fulfill`
- Catalog + pricing
  - `/v1/products`, `/v1/variants`, `/v1/price-lists`, `/v1/price-rules`

## Permissions (RBAC)
- `credit.reseller.read`, `credit.reseller.write`
- `credit.account.read`, `credit.account.write`
- `credit.limit.write`
- `credit.repayment.write`
- `orders.write` (or adapter-specific permission)
- `catalog.read`, `pricing.read`

## MVP Screens
1) Resellers
   - List + create reseller
   - Credit account summary (limit, used, status)

2) Credit
   - Set credit limits
   - Repayment entry form
   - Statement view (balance, due schedule)

3) Wholesale Orders
   - Order list + detail
   - Create order (reseller + products + quantities)
   - Fulfillment action

## Assumptions
- Reseller credit uses existing `reseller`, `credit_account`, `repayment` models.
- Orders use existing order + invoice flows, surfaced via wholesale adapter.
- Pricing is variant-level and already seeded for the wholesale subsidiary.

## Dependencies
- Reseller/credit endpoints stable and permissioned.
- Wholesale adapter endpoints available and audited.
- Catalog + pricing accessible for the wholesale subsidiary.

## Success Criteria
- Onboard a reseller with a credit limit in under 5 minutes.
- Place a wholesale order and record repayment end-to-end.
- Statement view reflects credit usage accurately.

## Rollout Plan
Phase 0: Use Admin/Ops with role-gated menu entries for wholesale.
Phase 1: Split to standalone app once workflows are stable and roles are validated.
Phase 2: Add reporting and advanced credit operations (aging buckets, dunning).

## Decision Record (MVP)
- Credit limit changes require `credit.limit.write` and are audited with reason + actor.
- Wholesale order creation enforces available credit; override requires a separate admin permission.
- Repayments auto-apply FIFO to oldest open invoices; store allocation links.

Implementation tasks and follow-ups: `docs/reseller-wholesale-mvp-tasks.md`.
