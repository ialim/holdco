# ERP export templates

This folder contains CSV templates and mapping stubs that align with the finance export endpoints.

## Export endpoints
- GET /v1/finance/exports/journals
- GET /v1/finance/exports/invoices
- GET /v1/finance/exports/credit-notes
- GET /v1/finance/exports/intercompany
- GET /v1/finance/exports/payments

Query params:
- format=csv|json
- period=YYYY-MM
- fiscal_period_id (journals)
- invoice_type (invoices/credit-notes)
- start_date, end_date (YYYY-MM-DD)

## Templates
- templates/*.template.csv contain the header rows produced by the API.
- mappings/*.mapping.template.csv are ERP-specific field mapping stubs. Fill the erp_field column.

## Example request
curl -H "Authorization: Bearer <token>" \
  -H "X-Group-Id: <group_id>" \
  -H "X-Subsidiary-Id: <subsidiary_id>" \
  "http://localhost:3000/v1/finance/exports/journals?format=csv&period=2024-06"

## Export runner (CSV + optional SFTP)
1) Copy `config.template.json` to `config.json` and fill in IDs + export options.
2) Run:
   `npm --prefix apps/api run erp:export`

Options:
- `--config <path>` override config file.
- `--once` run a single cycle (default when schedule interval is 0).
- `--validate` validate template headers against export columns.
- `--dry-run` skip writing files + SFTP upload.

Scheduling:
- Set `ERP_EXPORT_INTERVAL_MINUTES` or `schedule.intervalMinutes` in config.json to run on a timer.

## Notes
- These are starting points; ERP import formats can differ by version or localization.
- Use the mapping files to align HoldCo export fields to your ERP's import columns.
