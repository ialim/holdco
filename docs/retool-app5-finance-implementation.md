# Retool App 5: Finance Ops Implementation Steps

This is a step-by-step build guide for Finance Ops. It complements:
- Layout: `docs/retool-app5-finance-layout.md`
- Checklist: `docs/retool-admin-ops-apps.md`

## Prerequisites
- Global helpers and headers from `docs/retool-admin-ops.md`.
- Finance permissions per `docs/rbac-policies.md`.
- `subsidiaryId` is required for cost centers and journal entries.

## 1) App setup
1. Create a new Retool app: "Finance Ops".
2. Add global state keys if missing: `groupId`, `subsidiaryId`, `locationId`, `channel`, `jwt`.
3. Add an optional fiscal period selector (`selectFiscalPeriod`).

## 2) Queries
All queries use the REST resource and headers from `{{buildHeaders.value}}`.
All write queries include `Idempotency-Key: {{newIdempotencyKey.value}}`.

### Chart of Accounts
`qListCoa` (GET `/finance/accounts`)
- Params: `limit`, `offset`, `q`, `status` (optional).

`qCreateCoa` (POST `/finance/accounts`)
- Body:
```json
{
  "code": "{{inputAccountCode.value}}",
  "name": "{{inputAccountName.value}}",
  "type": "{{selectAccountType.value}}",
  "parent_id": "{{selectParentAccount.value}}"
}
```

### Cost Centers
`qListCostCenters` (GET `/finance/cost-centers`)
- Params: `limit`, `offset`, `q`.

`qCreateCostCenter` (POST `/finance/cost-centers`)
- Body:
```json
{
  "code": "{{inputCostCenterCode.value}}",
  "name": "{{inputCostCenterName.value}}"
}
```

### Fiscal Periods
`qListPeriods` (GET `/finance/fiscal-periods`)
- Params: `limit`, `offset`, `q`.

`qCreatePeriod` (POST `/finance/fiscal-periods`)
- Body:
```json
{
  "name": "{{inputPeriodName.value}}",
  "start_date": "{{inputPeriodStart.value}}",
  "end_date": "{{inputPeriodEnd.value}}",
  "status": "{{selectPeriodStatus.value}}"
}
```

### Journal Entries
`qListJournals` (GET `/finance/journal-entries`)
- Params: `limit`, `offset`, `q`, `start_date`, `end_date`.

`qCreateJournal` (POST `/finance/journal-entries`)
- Body:
```json
{
  "fiscal_period_id": "{{selectFiscalPeriod.value}}",
  "reference": "{{inputJournalReference.value}}",
  "memo": "{{inputJournalMemo.value}}",
  "lines": {{tableJournalLines.data || []}}
}
```

### Intercompany Agreements
`qCreateAgreement` (POST `/finance/intercompany-agreements`)
- Body:
```json
{
  "provider_company_id": "{{selectProviderCompany.value}}",
  "recipient_company_id": "{{selectRecipientCompany.value}}",
  "type": "{{selectAgreementType.value}}",
  "pricing_model": "{{selectPricingModel.value}}",
  "markup_rate": {{inputMarkupRate.value}},
  "fixed_fee_amount": {{inputFixedFee.value}},
  "vat_applies": {{toggleVatApplies.value}},
  "vat_rate": {{inputVatRate.value}},
  "wht_applies": {{toggleWhtApplies.value}},
  "wht_rate": {{inputWhtRate.value}},
  "wht_tax_type": "{{selectWhtTaxType.value}}",
  "effective_from": "{{inputEffectiveFrom.value}}",
  "effective_to": "{{inputEffectiveTo.value}}"
}
```

`qUpdateAgreement` (PATCH `/finance/intercompany-agreements/{{tableAgreements.selectedRow.id}}`)
- Body uses the same fields as create; send only changed fields.

### Exports
`qExportInvoices` (GET `/finance/exports/invoices`)
- Params: `format`, `start_date`, `end_date`, `period`, `fiscal_period_id`.

`qExportJournals` (GET `/finance/exports/journals`)
- Params: `format`, `start_date`, `end_date`, `period`, `fiscal_period_id`.

`qExportPayments` (GET `/finance/exports/payments`)
- Params: `format`, `start_date`, `end_date`, `period`, `fiscal_period_id`.

## 3) Component wiring
- Tables bind to list queries.
- Drawer submit -> write query -> refresh list + close drawer.
- Export buttons trigger export queries and show response download links.

## 4) QA smoke tests
- Create a COA, cost center, and fiscal period.
- Create a journal entry with valid lines.
- Create or update an intercompany agreement.
- Export invoices/journals/payments for a small date range.
