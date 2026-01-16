# Retool App 7: Reseller/Wholesale Portal Layout

This layout describes page structure, components, and query wiring for the Reseller/Wholesale portal MVP. It relies on `docs/retool-admin-ops.md` for global helpers and `docs/retool-admin-ops-apps.md` for query checklist.

## Page structure
- Header
  - Breadcrumb: Wholesale / Reseller Portal
  - Subsidiary selector (if not locked by tenant context)
  - Date range filter
- Main tabs
  - Resellers
  - Credit
  - Wholesale Orders

## Wireframe (ASCII)
```
+----------------------------------------------------------------------------------+
| Wholesale / Reseller Portal   [Subsidiary] [Date Range]                          |
+----------------------------------------------------------------------------------+
| Tabs: [Resellers] [Credit] [Wholesale Orders]                                    |
|                                                                                  |
| Resellers tab                                                                    |
| +-------------------------------+  +-----------------------------------------+  |
| | Reseller Table                |  | Reseller Detail + Credit Summary        |  |
| | (name, status, limit, used)   |  | - Credit limit / used / available       |  |
| +-------------------------------+  | - Actions: Set Limit, Record Repayment  |  |
|                                    +-----------------------------------------+  |
|                                                                                  |
| Credit tab                                                                       |
| +-------------------------------+  +-----------------------------------------+  |
| | Credit Accounts Table         |  | Statement / Aging Panel                 |  |
| | (reseller, limit, used, status)| | - Payments / schedule / balance         |  |
| +-------------------------------+  +-----------------------------------------+  |
|                                                                                  |
| Orders tab                                                                       |
| +-------------------------------+  +-----------------------------------------+  |
| | Orders Table                  |  | Order Detail + Fulfill Action           |  |
| | (order_no, status, total)     |  | - Items list                            |  |
| +-------------------------------+  | - Create Order Drawer                   |  |
|                                    |   • Available credit banner             |  |
|                                    |   • Override toggle (if permitted)      |  |
|                                    +-----------------------------------------+  |
+----------------------------------------------------------------------------------+
```

## Component map (IDs -> queries)
- `dateRange` -> re-run list queries
- Resellers tab
  - `tableResellers` -> `qListResellers`
  - `panelResellerDetail` -> `qGetReseller` (optional)
  - `drawerResellerCreate` -> `qCreateReseller`
  - `drawerCreditLimit` -> `qSetCreditLimit`
  - `drawerRepayment` -> `qCreateRepayment`
- Credit tab
  - `tableCreditAccounts` -> `qListCreditAccounts`
  - `panelCreditReport` -> `qCreditReport`
- Orders tab
  - `tableWholesaleOrders` -> `qListWholesaleOrders`
  - `panelOrderDetail` -> `qGetOrder`
  - `drawerWholesaleOrder` -> `qCreateWholesaleOrder`
  - `btnFulfillOrder` -> `qFulfillWholesaleOrder`
  - `toggleCreditOverride` -> visible when user has `credit.limit.override`

## Shared components
- `dateRange`
- Tables: `tableResellers`, `tableCreditAccounts`, `tableWholesaleOrders`
- Drawers: `drawerResellerCreate`, `drawerCreditLimit`, `drawerRepayment`, `drawerWholesaleOrder`
- Panels: `panelResellerDetail`, `panelCreditReport`, `panelOrderDetail`
- Toasts for success/error
  - Banner: `creditAvailableBanner` inside order drawer

## Query wiring (naming convention)
- Resellers: `qListResellers`, `qCreateReseller`, optional `qGetReseller`
- Credit: `qListCreditAccounts`, `qSetCreditLimit`, `qCreateRepayment`, `qCreditReport`
- Wholesale orders: `qListWholesaleOrders`, `qCreateWholesaleOrder`, `qFulfillWholesaleOrder`

Each query should set headers to `{{buildHeaders.value}}`.
Create/update queries must set `Idempotency-Key: {{newIdempotencyKey.value}}`.

## Recommended defaults
- Date range defaults to last 30 days.
- Reseller list defaults to `status=active` if filter exists.
