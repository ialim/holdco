-- AlterTable
ALTER TABLE "suppliers" ADD COLUMN     "external_client_id" UUID;

-- CreateIndex
CREATE INDEX "suppliers_external_client_id_idx" ON "suppliers"("external_client_id");

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_external_client_id_fkey" FOREIGN KEY ("external_client_id") REFERENCES "external_clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
