# Ledger Setup Package (Standard LedgerAccount Seeder)

This package adds a NestJS module and endpoint to seed standard LedgerAccount posting codes into your database.

## Endpoint
POST /ledger-setup/standard-accounts
Body:
{
  "groupId": "<tenantGroupId>",
  "subsidiaryId": "<optional subsidiary id>"
}

- If subsidiaryId is omitted, it seeds accounts for all active subsidiaries in the group.
- Idempotent: uses createMany(skipDuplicates: true), so it will only add missing codes.

## Install
1) Copy `src/modules/ledger-setup` into your project at the same path.
2) Ensure your PrismaService import path matches:
   - Current code uses: ../../prisma/prisma.service
3) Add LedgerSetupModule to your AppModule imports.

## Notes
- This seeds LedgerAccount only (as requested).
- Types are generic strings (ASSET/LIABILITY/REVENUE/EXPENSE/COGS).
