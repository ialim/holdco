-- CreateTable
CREATE TABLE "variant_assortments" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "subsidiary_id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "source_subsidiary_id" UUID,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "variant_assortments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "variant_assortments_group_id_idx" ON "variant_assortments"("group_id");

-- CreateIndex
CREATE INDEX "variant_assortments_subsidiary_id_idx" ON "variant_assortments"("subsidiary_id");

-- CreateIndex
CREATE INDEX "variant_assortments_variant_id_idx" ON "variant_assortments"("variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "variant_assortments_subsidiary_id_variant_id_key" ON "variant_assortments"("subsidiary_id", "variant_id");

-- AddForeignKey
ALTER TABLE "variant_assortments" ADD CONSTRAINT "variant_assortments_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "tenant_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_assortments" ADD CONSTRAINT "variant_assortments_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "subsidiaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_assortments" ADD CONSTRAINT "variant_assortments_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_assortments" ADD CONSTRAINT "variant_assortments_source_subsidiary_id_fkey" FOREIGN KEY ("source_subsidiary_id") REFERENCES "subsidiaries"("id") ON DELETE SET NULL ON UPDATE CASCADE;
