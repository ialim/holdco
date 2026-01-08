-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "subsidiary_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "product_filters" JSONB,
    "variant_filters" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "categories_group_id_idx" ON "categories"("group_id");

-- CreateIndex
CREATE INDEX "categories_subsidiary_id_idx" ON "categories"("subsidiary_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_subsidiary_id_code_key" ON "categories"("subsidiary_id", "code");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "tenant_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "subsidiaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
