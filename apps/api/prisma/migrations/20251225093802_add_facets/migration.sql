-- CreateTable
CREATE TABLE "facet_definitions" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'product',
    "data_type" TEXT NOT NULL DEFAULT 'text',
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "facet_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facet_values" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "facet_id" UUID NOT NULL,
    "value" TEXT NOT NULL,
    "normalized_value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "facet_values_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_facets" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "facet_value_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_facets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant_facets" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "facet_value_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "variant_facets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "facet_definitions_group_id_idx" ON "facet_definitions"("group_id");

-- CreateIndex
CREATE UNIQUE INDEX "facet_definitions_group_id_key_key" ON "facet_definitions"("group_id", "key");

-- CreateIndex
CREATE INDEX "facet_values_facet_id_idx" ON "facet_values"("facet_id");

-- CreateIndex
CREATE INDEX "facet_values_group_id_idx" ON "facet_values"("group_id");

-- CreateIndex
CREATE UNIQUE INDEX "facet_values_facet_id_normalized_value_key" ON "facet_values"("facet_id", "normalized_value");

-- CreateIndex
CREATE INDEX "product_facets_facet_value_id_idx" ON "product_facets"("facet_value_id");

-- CreateIndex
CREATE INDEX "product_facets_product_id_idx" ON "product_facets"("product_id");

-- CreateIndex
CREATE INDEX "product_facets_group_id_idx" ON "product_facets"("group_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_facets_product_id_facet_value_id_key" ON "product_facets"("product_id", "facet_value_id");

-- CreateIndex
CREATE INDEX "variant_facets_facet_value_id_idx" ON "variant_facets"("facet_value_id");

-- CreateIndex
CREATE INDEX "variant_facets_variant_id_idx" ON "variant_facets"("variant_id");

-- CreateIndex
CREATE INDEX "variant_facets_group_id_idx" ON "variant_facets"("group_id");

-- CreateIndex
CREATE UNIQUE INDEX "variant_facets_variant_id_facet_value_id_key" ON "variant_facets"("variant_id", "facet_value_id");

-- AddForeignKey
ALTER TABLE "facet_definitions" ADD CONSTRAINT "facet_definitions_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "tenant_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facet_values" ADD CONSTRAINT "facet_values_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "tenant_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facet_values" ADD CONSTRAINT "facet_values_facet_id_fkey" FOREIGN KEY ("facet_id") REFERENCES "facet_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_facets" ADD CONSTRAINT "product_facets_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "tenant_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_facets" ADD CONSTRAINT "product_facets_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_facets" ADD CONSTRAINT "product_facets_facet_value_id_fkey" FOREIGN KEY ("facet_value_id") REFERENCES "facet_values"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_facets" ADD CONSTRAINT "variant_facets_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "tenant_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_facets" ADD CONSTRAINT "variant_facets_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_facets" ADD CONSTRAINT "variant_facets_facet_value_id_fkey" FOREIGN KEY ("facet_value_id") REFERENCES "facet_values"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
