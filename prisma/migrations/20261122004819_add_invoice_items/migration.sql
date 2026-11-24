/*
  Warnings:

  - You are about to drop the column `amount` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `reservationId` on the `invoices` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "invoices" DROP CONSTRAINT "invoices_reservationId_fkey";

-- DropIndex
DROP INDEX "invoices_reservationId_idx";

-- AlterTable
ALTER TABLE "invoices" DROP COLUMN "amount",
DROP COLUMN "description",
DROP COLUMN "reservationId",
ADD COLUMN     "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "reservationId" TEXT,

    CONSTRAINT "invoice_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "invoice_items_invoiceId_idx" ON "invoice_items"("invoiceId");

-- CreateIndex
CREATE INDEX "invoice_items_reservationId_idx" ON "invoice_items"("reservationId");

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
