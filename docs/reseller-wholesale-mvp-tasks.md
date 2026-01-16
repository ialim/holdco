# Reseller/Wholesale MVP Tasks

## Scope
Execution tasks to implement the MVP decisions for reseller credit + wholesale orders.

## Data Model and Validation Constraints
1) Credit enforcement
   - Use `credit_account.limit_amount` and `credit_account.used_amount`.
   - Available credit = limit_amount - used_amount.
   - On wholesale order create, reject if available credit < order total.
   - Override allowed only for a dedicated permission (recommended: `credit.limit.override`).

2) Repayment allocation
   - Repayments apply FIFO to oldest open invoices.
   - Track allocations (repayment -> invoice) for reconciliation and statements.
   - If no open invoices, apply to account balance and keep `unapplied_amount`.

3) Credit limit changes
   - Require `credit.limit.write`.
   - Capture `reason` and `actor_id` in audit log.

## API Tasks
1) Wholesale order create
   - Enforce available credit (block or override).
   - Return error code `credit.limit.exceeded` with available/required amounts.

2) Repayments
   - Allocate repayments to open invoices FIFO.
   - Persist allocation records (new table if needed).
   - Update `credit_account.used_amount` after allocation.

3) Credit statements
   - `/reports/credit` returns: limit, used, available, aging buckets, open invoices, repayments.
   - Include allocations for traceability.

## UI Tasks (Reseller/Wholesale Portal)
1) Reseller detail panel
   - Show credit limit, used, available.
   - Show last repayment and next due date (if schedule exists).

2) Credit limit change
   - Form field for reason.
   - Confirm dialog when increasing limit.

3) Order create
   - Display available credit inline.
   - Block submission with clear error when credit insufficient.
   - If user has override permission, show "Override" toggle.

4) Credit report
   - Aging buckets (0-30, 31-60, 61-90, 90+).
   - Repayment history with allocation breakdown.

## RBAC Tasks
- Add permission `credit.limit.override`.
- Gate override UI and API branch on this permission.

## Tests
1) Credit enforcement
   - Order with amount > available credit is rejected.
   - Override succeeds only with `credit.limit.override`.

2) Repayment allocation
   - FIFO allocation to oldest open invoices.
   - Unapplied balance recorded when no open invoices.

3) Statements
   - Report totals match invoices minus repayments.
