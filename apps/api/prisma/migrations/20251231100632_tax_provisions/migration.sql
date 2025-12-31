-- CreateTable
CREATE TABLE "tax_provisions" (
    "id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "period" TEXT NOT NULL,
    "tax_type" TEXT NOT NULL,
    "taxable_profit" DECIMAL(12,2) NOT NULL,
    "tax_rate" DECIMAL(8,4) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROVISIONED',
    "payment_ref" TEXT,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_provisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tax_provisions_company_id_period_idx" ON "tax_provisions"("company_id", "period");

-- CreateIndex
CREATE UNIQUE INDEX "tax_provisions_company_id_period_tax_type_key" ON "tax_provisions"("company_id", "period", "tax_type");

-- AddForeignKey
ALTER TABLE "tax_provisions" ADD CONSTRAINT "tax_provisions_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "subsidiaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
