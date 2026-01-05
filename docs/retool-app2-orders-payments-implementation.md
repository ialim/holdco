# Retool App 2: Orders and Payments Ops Implementation Steps

This is a step-by-step build guide for Orders and Payments Ops. It complements:
- Layout: `docs/retool-app2-orders-payments-layout.md`
- Checklist: `docs/retool-admin-ops-apps.md`

## Prerequisites
- Global helpers and headers from `docs/retool-admin-ops.md`.
- Permissions: `orders.read`, `payments.intent.create`, `payments.capture`, `payments.refund`, `payments.reconcile`.

## 1) App setup
1. Create a new Retool app: "Orders & Payments Ops".
2. Add global state keys if missing: `groupId`, `subsidiaryId`, `locationId`, `channel`, `jwt`.
3. Add filters: `statusFilter`, `dateRange`.

## 2) Queries
All queries use the REST resource and headers from `{{buildHeaders.value}}`.
All write queries include `Idempotency-Key: {{newIdempotencyKey.value}}`.

### Orders
`qListOrders` (GET `/orders`)
- Params: `limit`, `offset`, `status`, `start_date`, `end_date`, `q`.

`qGetOrder` (GET `/orders/{{tableOrders.selectedRow.id}}`)

### Payments
`qCreatePaymentIntent` (POST `/payments/intents`)
- Body:
```json
{
  "order_id": "{{tableOrders.selectedRow.id}}",
  "amount": {{inputPaymentAmount.value}},
  "currency": "{{inputPaymentCurrency.value}}",
  "provider": "{{selectPaymentProvider.value}}",
  "capture_method": "{{selectCaptureMethod.value}}",
  "payment_method": "{{selectPaymentMethod.value}}",
  "customer_email": "{{inputCustomerEmail.value}}"
}
```

`qCapturePaymentIntent` (POST `/payments/{{storedPaymentIntentId.value}}/capture`)

`qCreateRefund` (POST `/refunds`)
- Body:
```json
{
  "payment_id": "{{inputRefundPaymentId.value}}",
  "amount": {{inputRefundAmount.value}},
  "reason": "{{inputRefundReason.value}}"
}
```

`qReconcilePayments` (POST `/payments/reconcile`)
- Body:
```json
{
  "provider": "{{selectReconcileProvider.value}}",
  "from": "{{dateRange.value.start}}",
  "to": "{{dateRange.value.end}}"
}
```

## 3) Component wiring
- `statusFilter` and `dateRange` changes -> re-run `qListOrders`.
- `tableOrders` row select -> `qGetOrder` -> populate detail panel.
- `drawerPaymentIntent` submit -> `qCreatePaymentIntent` -> set `storedPaymentIntentId`.
- Capture button uses `storedPaymentIntentId` -> `qCapturePaymentIntent`.
- Refund modal submit -> `qCreateRefund` -> refresh `qGetOrder`.
- Reconcile button -> `qReconcilePayments`.

## 4) QA smoke tests
- Filter orders by date range and status.
- Create a payment intent and capture it.
- Submit a refund and confirm order detail refresh.
- Run reconcile for a date range without error.
