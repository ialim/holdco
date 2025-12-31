-- DropIndex
DROP INDEX "suppliers_external_client_id_idx";

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_external_client_id_key" ON "suppliers"("external_client_id");
