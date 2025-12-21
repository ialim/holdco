/*
  Warnings:

  - You are about to drop the column `type` on the `variants` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "products" ADD COLUMN     "type" TEXT;

-- AlterTable
ALTER TABLE "variants" DROP COLUMN "type";
