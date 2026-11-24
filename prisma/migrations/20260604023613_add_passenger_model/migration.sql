-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('INFANT', 'CHILD', 'ADULT');

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "passport_number" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "passport_issue_date" TIMESTAMP(3),
    "passport_expiry_date" TIMESTAMP(3) NOT NULL,
    "type" "ClientType" NOT NULL,
    "nationality" TEXT NOT NULL,
    "birth_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clients_passport_number_key" ON "clients"("passport_number");

-- CreateIndex
CREATE INDEX "clients_full_name_idx" ON "clients"("full_name");

-- CreateIndex
CREATE INDEX "clients_passport_number_idx" ON "clients"("passport_number");

-- CreateIndex
CREATE INDEX "clients_type_idx" ON "clients"("type");
