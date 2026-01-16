# Retool App 7: Reseller/Wholesale Portal Implementation Steps

This is a step-by-step build guide for the Reseller/Wholesale portal MVP. It complements:
- Layout: `docs/retool-app7-reseller-wholesale-layout.md`
- Checklist: `docs/retool-admin-ops-apps.md`

## Prerequisites
- Global helpers and headers from `docs/retool-admin-ops.md`.
- Permissions: `credit.reseller.read`, `credit.reseller.write`, `credit.account.read`, `credit.account.write`, `credit.limit.write`, `credit.repayment.write`, `orders.write`, `catalog.read`, `pricing.read`, `reports.credit`.

## 1) App setup
1. Create a new Retool app: "Reseller/Wholesale Portal".
2. Add global state keys if missing: `groupId`, `subsidiaryId`, `locationId`, `channel`, `jwt`.
3. Add filters: `dateRange`, optional `resellerStatus`.

## 2) Queries
All queries use the REST resource and headers from `{{buildHeaders.value}}`.
All write queries include `Idempotency-Key: {{newIdempotencyKey.value}}`.

### Resellers
`qListResellers` (GET `/resellers`)
- Params: `limit`, `offset`, `status`, `q`.

`qCreateReseller` (POST `/resellers`)
- Body:
```json
{
  "name": "{{inputResellerName.value}}",
  "status": "{{selectResellerStatus.value}}"
}
```

Optional `qGetReseller` (GET `/resellers/{{tableResellers.selectedRow.id}}`).

### Credit
`qListCreditAccounts` (GET `/credit-accounts`)
- Params: `limit`, `offset`, `reseller_id`.

`qSetCreditLimit` (POST `/credit-limits`)
- Body:
```json
{
  "reseller_id": "{{tableResellers.selectedRow.id}}",
  "limit_amount": {{inputCreditLimit.value}},
  "currency": "{{selectCreditCurrency.value}}"
}
```

`qCreateRepayment` (POST `/adapters/credit/repayments`)
- Body:
```json
{
  "credit_account_id": "{{tableCreditAccounts.selectedRow.id}}",
  "amount": {{inputRepaymentAmount.value}},
  "method": "{{selectRepaymentMethod.value}}",
  "paid_at": "{{inputRepaymentDate.value}}"
}
```

`qCreditReport` (GET `/reports/credit`)
- Params: `reseller_id`, `start_date`, `end_date`.

### Wholesale orders
`qListWholesaleOrders` (GET `/orders`)
- Params: `limit`, `offset`, `channel=wholesale`, `status`, `start_date`, `end_date`, `reseller_id`.

`qCreateWholesaleOrder` (POST `/adapters/wholesale/orders`)
- Body:
```json
{
  "reseller_id": "{{tableResellers.selectedRow.id}}",
  "items": {{tableOrderItems.data}},
  "notes": "{{inputOrderNotes.value}}"
}
```

`qFulfillWholesaleOrder` (POST `/adapters/wholesale/orders/{{tableWholesaleOrders.selectedRow.id}}/fulfill`)

## 3) Component wiring
- `dateRange` changes -> re-run `qListResellers`, `qListWholesaleOrders`, `qCreditReport`.
- `tableResellers` row select -> populate reseller detail + re-run `qListCreditAccounts` and `qCreditReport`.
- `drawerResellerCreate` submit -> `qCreateReseller` -> refresh list.
- `drawerCreditLimit` submit -> `qSetCreditLimit` -> refresh reseller + credit account list.
- `drawerRepayment` submit -> `qCreateRepayment` -> refresh credit report.
- `drawerWholesaleOrder` submit -> `qCreateWholesaleOrder` -> refresh orders list.
- `btnFulfillOrder` -> `qFulfillWholesaleOrder` -> refresh selected order.

## 4) QA smoke tests
- Create a reseller and verify it appears in the list.
- Set credit limit and confirm account balances update.
- Record a repayment and verify it appears in the credit report.
- Create a wholesale order and fulfill it.
