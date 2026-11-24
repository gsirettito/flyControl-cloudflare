/*
  Warnings:

  - Made the column `companyId` on table `clients` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "clients" ALTER COLUMN "companyId" SET NOT NULL;

-- AlterTable
ALTER TABLE "flights" ADD COLUMN     "companyId" TEXT;

-- AddForeignKey
ALTER TABLE "flights" ADD CONSTRAINT "flights_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
