# HoldCo API (NestJS)

This app assembles the finance and shared-services modules from the module packs.

## Modules
- Catalog: src/catalog/*
- Inventory: src/inventory/*
- Pricing: src/pricing/*
- Orders: src/orders/*
- Payments: src/payments/*
- Credit: src/credit/*
- Loyalty: src/loyalty/*
- Logistics: src/logistics/*
- Reports: src/reports/*
- HR: src/hr/*
- Compliance: src/compliance/*
- Procurement: src/procurement/*
- Advisory: src/advisory/*
- Finance: src/finance/*
- Shared services: src/shared-services/*
- RBAC: src/roles/*
- Tenancy: src/tenancy/*
- Prisma: src/prisma/*
- RBAC helpers: src/auth/*

## Quick start
1) Create env file: copy `.env.example` to `.env` and update values.
2) Install deps: npm install
3) Run: npm run start:dev

Notes:
- Configure DATABASE_URL for Prisma.
- Shared services uses DTO validation aligned with docs/openapi-v1.yaml.
- Auth should populate `req.user.permissions` (array of strings); the JWT middleware maps roles to permissions when only `roles` are present.
- Set `JWT_SECRET` so the JWT middleware can verify tokens.
- Use `AUTH_DEV_LOGIN_ENABLED=true` to enable the dev-only `/v1/auth/login` endpoint locally.
