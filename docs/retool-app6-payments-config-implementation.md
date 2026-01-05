# Retool App 6: Payments Config and KYC Implementation Steps

This is a step-by-step build guide for Payments Config and KYC. It complements:
- Layout: `docs/retool-app6-payments-config-layout.md`
- Checklist: `docs/retool-admin-ops-apps.md`

## Prerequisites
- Global helpers and headers from `docs/retool-admin-ops.md`.
- Permission: `payments.config.manage`.

## 1) App setup
1. Create a new Retool app: "Payments Config & KYC".
2. Add global state keys if missing: `groupId`, `subsidiaryId`, `locationId`, `channel`, `jwt`.
3. Add filters: `selectEnvironment`, `selectProvider`, `selectSubsidiary`.

## 2) Queries
All queries use the REST resource and headers from `{{buildHeaders.value}}`.
All write queries include `Idempotency-Key: {{newIdempotencyKey.value}}`.

`qListPaymentConfigs` (GET `/payments/providers`)
- Params: `limit`, `offset`, `subsidiary_id`, `provider`, `environment`, `status`.

`qUpdatePaymentConfig` (PATCH `/payments/providers/{{tableConfigs.selectedRow.id}}`)
- Body:
```json
{
  "status": "{{selectStatus.value}}",
  "settlement_account_name": "{{inputSettlementName.value}}",
  "settlement_account_number": "{{inputSettlementNumber.value}}",
  "settlement_bank_name": "{{inputSettlementBankName.value}}",
  "settlement_bank_code": "{{inputSettlementBankCode.value}}",
  "settlement_currency": "{{inputSettlementCurrency.value}}",
  "contact_name": "{{inputContactName.value}}",
  "contact_email": "{{inputContactEmail.value}}",
  "contact_phone": "{{inputContactPhone.value}}",
  "provider_merchant_id": "{{inputProviderMerchantId.value}}",
  "kyc_submitted_at": "{{inputKycSubmittedAt.value}}",
  "kyc_approved_at": "{{inputKycApprovedAt.value}}",
  "kyc_notes": "{{inputKycNotes.value}}"
}
```

Optional: create config when none exists.
`qCreatePaymentConfig` (POST `/payments/providers`)
- Body uses the same fields as update, plus:
```json
{
  "subsidiary_id": "{{selectSubsidiary.value}}",
  "provider": "{{selectProvider.value}}",
  "environment": "{{selectEnvironment.value}}"
}
```

## 3) Component wiring
- Filters re-run `qListPaymentConfigs`.
- `tableConfigs` row select populates the detail panel and edit drawer.
- Drawer submit -> `qUpdatePaymentConfig` (or `qCreatePaymentConfig` if none exists).

## 4) QA smoke tests
- Filter by provider and environment.
- Update settlement details and KYC contact info.
- Change status from draft to submitted without validation errors.
