# Retool App 2: Orders & Payments Ops Layout

This layout describes page structure, components, and query wiring for Orders and Payments Ops. It relies on `docs/retool-admin-ops.md` for global helpers and `docs/retool-admin-ops-apps.md` for query checklist.

## Page structure
- Header
  - Breadcrumb: Ops / Orders & Payments
  - Date range filters (start/end)
  - Status filter dropdown
- Main split
  - Left: Orders table
  - Right: Order detail + payment actions

## Wireframe (ASCII)
```
+----------------------------------------------------------------------------------+
| Ops / Orders & Payments   [Date Range] [Status]                                  |
+----------------------------------------------------------------------------------+
| +-------------------------------+  +-----------------------------------------+  |
| | Orders Table                  |  | Order Detail Panel                      |  |
| | (order_no, status, total,     |  | - Summary + items                        |  |
| |  currency, created_at)        |  | - Buttons: Create Intent / Capture       |  |
| +-------------------------------+  | - Refund modal trigger                   |  |
|                                    +-----------------------------------------+  |
| Drawer: Payment Intent                                                         |
| Modal: Refund                                                                  |
+----------------------------------------------------------------------------------+
```

## Component map (IDs -> queries)
- `statusFilter`, `dateRange` -> re-run `qListOrders`
- `tableOrders` -> data: `qListOrders`, row select -> `qGetOrder`
- `drawerPaymentIntent` submit -> `qCreatePaymentIntent`
- `btnCapturePayment` -> `qCapturePaymentIntent`
- `modalRefund` submit -> `qCreateRefund`
- `btnReconcilePayments` -> `qReconcilePayments`

## Shared components
- `dateRange` (start/end)
- `statusFilter`
- Orders table `tableOrders`
- Detail panel `panelOrder`
- Payment form drawer `drawerPaymentIntent`
- Refund modal `modalRefund`
- Toasts for success/error

## Query wiring (naming convention)
- List orders: `qListOrders`
- Get order: `qGetOrder`
- Create payment intent: `qCreatePaymentIntent`
- Capture payment: `qCapturePaymentIntent`
- Create refund: `qCreateRefund`
- Reconcile: `qReconcilePayments`

Each query should set headers to `{{buildHeaders.value}}`.
Create/update queries must set `Idempotency-Key: {{newIdempotencyKey.value}}`.

## Component wiring

### Orders table
- `qListOrders` runs on load and when `dateRange` or `statusFilter` changes.
- Row selection triggers `qGetOrder` to populate `panelOrder`.
- Table row fields: order_no, status, total_amount, currency, created_at.

### Order detail panel
Shows:
- Order summary (customer/reseller, total, currency).
- Items list with quantity and unit_price.
- Action buttons:
  - “Create Payment Intent” (opens `drawerPaymentIntent`)
  - “Capture Payment” (enabled when a payment intent id is available)
  - “Refund” (opens `modalRefund`)

### Payment intent drawer
Fields:
- order_id (hidden from selected order)
- amount (default to order total)
- currency (default to order currency)
- provider (optional)
- payment_method (card/transfer/ussd)
- customer_email (required if order has no customer email)

Submit -> `qCreatePaymentIntent`, then surface the `payment_intent.id` to the panel for capture.

### Capture flow
- `qCapturePaymentIntent` uses the stored payment intent id from the create response.
- On success: show status and refresh `qGetOrder`.

### Refund modal
Fields:
- payment_id (payment intent id)
- amount (default to captured amount)
- reason (optional)

Submit -> `qCreateRefund`, then refresh `qGetOrder`.

### Reconcile
- Button for `qReconcilePayments` (provider + date range) for finance admins.

## Validation rules (summary)
- Orders are create-only; no update flow here.
- Payment intent fields: order_id, amount >= 0, currency 3-letter, payment_method enum.
- Refund: payment_id UUID, amount >= 0.

## Recommended defaults
- Date range default to last 7 days.
- Status filter default to “all”.
