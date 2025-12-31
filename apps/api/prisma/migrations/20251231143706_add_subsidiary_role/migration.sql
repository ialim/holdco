-- CreateEnum
CREATE TYPE "SubsidiaryRole" AS ENUM ('HOLDCO', 'PROCUREMENT_TRADING', 'RETAIL', 'RESELLER', 'DIGITAL_COMMERCE', 'LOGISTICS');

-- AlterTable
ALTER TABLE "subsidiaries" ADD COLUMN     "role" "SubsidiaryRole";
