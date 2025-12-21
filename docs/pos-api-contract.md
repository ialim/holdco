# POS API Contract (Retail)

This document defines the minimum API contract for the retail POS replacement that will consume the unified backend.

## Auth and required headers
- Authorization: `Bearer <jwt>`
- `X-Group-Id`: tenant group UUID
- `X-Subsidiary-Id`: retail subsidiary UUID
- `X-Location-Id`: store UUID
- `X-Channel`: `retail`
- `Idempotency-Key`: required on write operations for safe retries

## Core capabilities and endpoints
| POS capability | Endpoint | Notes |
| --- | --- | --- |
| Login | `POST /v1/auth/login` | POS obtains access token |
| Product lookup | `GET /v1/products?q=` or `GET /v1/products?barcode=` | Search by name/SKU or barcode |
| Stock lookup | `GET /v1/stock-levels?product_id=` | Store-level availability |
| Price lookup | `GET /v1/price-lists` + `GET /v1/price-rules` | Cache per store/channel |
| Create order | `POST /v1/orders` | Includes items and customer info |
| Create payment intent | `POST /v1/payments/intents` | For card or wallet payments |
| Capture payment | `POST /v1/payments/{payment_id}/capture` | Finalize payment |
| Refund | `POST /v1/refunds` | For returns and reversals |
| Loyalty | `POST /v1/points/issue` | Issue points after checkout |

## Order creation payload (example)
```json
{
  "customer_id": "uuid",
  "currency": "NGN",
  "items": [
    { "product_id": "uuid", "variant_id": "uuid", "quantity": 1, "unit_price": 25000 }
  ],
  "notes": "Walk-in customer"
}
```

## Payment intent payload (example)
```json
{
  "order_id": "uuid",
  "amount": 25000,
  "currency": "NGN",
  "provider": "paystack",
  "capture_method": "automatic"
}
```

## Error handling and retries
- Standard error format: `{ "error": { "code": "...", "message": "...", "details": {} }, "request_id": "..." }`
- Retry network timeouts with the same `Idempotency-Key`.
- Treat `409 Conflict` as "already processed" when idempotency keys match.

## Performance and offline mode
- POS should cache catalog, price lists, and promotions locally for quick lookup.
- If offline, queue orders and payments locally and replay when back online using idempotency keys.
- After reconnect, reconcile local order totals with `/v1/orders` and `/v1/reports/sales`.
