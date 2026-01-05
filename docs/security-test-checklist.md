# Security test checklist

Use this checklist before cutover and after major changes to auth, tenancy, or integrations.

## Latest execution
- Run: `npm --prefix apps/api run security:smoke`
- Results: health.open 200, orders.list.forbidden 403, orders.list.allowed 200, metrics.unauthorized 401, metrics.authorized 200
- JWT claim checks: missing permissions -> 403, missing sub -> 401
- JWT rotation test: primary + previous secrets accepted, missing sub rejected (`jwt-auth.middleware.spec.ts`)

## Identity and authentication
- [x] JWT validation rejects tampered tokens and expired tokens.
- [x] Tokens without required claims (sub, permissions, roles) are rejected or downgraded safely.
- [x] `JWT_SECRET` rotation plan is documented and tested. See `docs/jwt-rotation-plan.md`.
- [ ] No endpoints accept anonymous writes unless explicitly intended.

## Authorization and tenancy
- [x] All read and write endpoints enforce `x-group-id` and `x-subsidiary-id` scoping.
- [x] Group-level access is restricted to approved roles only.
- [ ] Cross-subsidiary access returns 404/403 without leaking existence.
- [ ] Admin-only endpoints enforce permissions and do not rely on client-provided role flags.

## Data handling and privacy
- [ ] PII fields are masked or excluded from logs where possible.
- [ ] Audit logs avoid storing secrets, full card data, or credentials.
- [ ] Export files (ERP/ICG) are stored with least-privilege permissions and rotation.

## API hardening
- [ ] Input validation rejects unknown fields and invalid IDs (UUIDs).
- [ ] Pagination limits are enforced to prevent unbounded queries.
- [ ] Rate limiting is configured for public endpoints.
- [ ] Idempotency is enforced for payments and webhook replays.

## Integrations and webhooks
- [ ] Payment and logistics webhooks validate signatures.
- [ ] Outbox publisher retries do not produce duplicate side effects.
- [x] Inbox consumers enforce idempotency keys and de-duplication.

## Metrics and observability
- [x] `/v1/metrics` requires `METRICS_TOKEN` when configured.
- [x] Security smoke test runs in CI: `npm --prefix apps/api run security:smoke`.
- [ ] Alerts exist for repeated authorization failures and unusual error rates.
