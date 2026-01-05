# Payment KYC Tracker

Use this tracker to coordinate merchant onboarding for each subsidiary and payment provider. Update as documents are collected, submitted, and approved. Store the runtime configuration in the API via `POST /v1/payments/providers`.

## Required documents (per subsidiary)
- CAC certificate + status report (CAC 1.1)
- TIN
- Director IDs (passport/NIN) + BVN (if required by provider)
- Proof of address (utility bill)
- Settlement bank details (account name/number, bank name/code, currency)
- KYC signatory contact (name, email, phone)
- Board resolution (if required by provider)

## Status definitions
- `draft`: docs not yet submitted
- `submitted`: submitted to provider; awaiting approval
- `approved`: provider approved
- `rejected`: provider rejected; update notes and resubmit

## KYC status by subsidiary/provider (live environment)
| Subsidiary | Provider | Environment | KYC Status | Merchant ID | Settlement Account | Signatory Contact | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Alims Perfume Trading Limited | Paystack | live | draft | TBD | TBD | TBD | |
| Alims Perfume Trading Limited | Flutterwave | live | draft | TBD | TBD | TBD | |
| Alims Retail Stores Limited | Paystack | live | draft | TBD | TBD | TBD | |
| Alims Retail Stores Limited | Flutterwave | live | draft | TBD | TBD | TBD | |
| Alims Reseller Network Limited | Paystack | live | draft | TBD | TBD | TBD | |
| Alims Reseller Network Limited | Flutterwave | live | draft | TBD | TBD | TBD | |
| Alims Digital Commerce Limited | Paystack | live | draft | TBD | TBD | TBD | |
| Alims Digital Commerce Limited | Flutterwave | live | draft | TBD | TBD | TBD | |
| Alims Logistics & Distribution Limited | Paystack | live | draft | TBD | TBD | TBD | |
| Alims Logistics & Distribution Limited | Flutterwave | live | draft | TBD | TBD | TBD | |
