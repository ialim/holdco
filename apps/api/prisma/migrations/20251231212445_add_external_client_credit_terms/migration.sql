-- AlterTable
ALTER TABLE "external_clients" ADD COLUMN "credit_limit" DECIMAL(12,2);
ALTER TABLE "external_clients" ADD COLUMN "credit_currency" TEXT;
ALTER TABLE "external_clients" ADD COLUMN "payment_term_days" INTEGER;
ALTER TABLE "external_clients" ADD COLUMN "negotiation_notes" TEXT;
ALTER TABLE "external_clients" ADD COLUMN "last_negotiated_at" TIMESTAMP(3);
ALTER TABLE "external_clients" ADD COLUMN "last_negotiated_by" TEXT;
