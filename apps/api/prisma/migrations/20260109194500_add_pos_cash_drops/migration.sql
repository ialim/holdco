-- CreateTable
CREATE TABLE "pos_cash_drops" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "subsidiary_id" UUID NOT NULL,
    "location_id" UUID NOT NULL,
    "pos_shift_id" UUID NOT NULL,
    "pos_device_id" UUID NOT NULL,
    "recorded_by" UUID,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'NGN',
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pos_cash_drops_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pos_cash_drops_pos_shift_id_idx" ON "pos_cash_drops"("pos_shift_id");

-- CreateIndex
CREATE INDEX "pos_cash_drops_location_id_idx" ON "pos_cash_drops"("location_id");

-- AddForeignKey
ALTER TABLE "pos_cash_drops" ADD CONSTRAINT "pos_cash_drops_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "tenant_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_cash_drops" ADD CONSTRAINT "pos_cash_drops_subsidiary_id_fkey" FOREIGN KEY ("subsidiary_id") REFERENCES "subsidiaries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_cash_drops" ADD CONSTRAINT "pos_cash_drops_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_cash_drops" ADD CONSTRAINT "pos_cash_drops_pos_shift_id_fkey" FOREIGN KEY ("pos_shift_id") REFERENCES "pos_shifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_cash_drops" ADD CONSTRAINT "pos_cash_drops_pos_device_id_fkey" FOREIGN KEY ("pos_device_id") REFERENCES "pos_devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_cash_drops" ADD CONSTRAINT "pos_cash_drops_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
