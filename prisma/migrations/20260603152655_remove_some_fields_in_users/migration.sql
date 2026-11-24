/*
  Warnings:

  - You are about to drop the column `balance` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `currency` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `tokenSecret` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "balance",
DROP COLUMN "currency",
DROP COLUMN "tokenSecret";
