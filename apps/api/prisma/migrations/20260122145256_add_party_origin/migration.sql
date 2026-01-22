ALTER TABLE "suppliers" ADD COLUMN "origin" TEXT NOT NULL DEFAULT 'domestic';
ALTER TABLE "external_clients" ADD COLUMN "origin" TEXT NOT NULL DEFAULT 'domestic';
