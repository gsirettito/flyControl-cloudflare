-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "notifyEmailConfirm" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notifyFlightReminders" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notifyManagerEmail" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notifySmsConfirm" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "reservations" ADD COLUMN     "sent24hReminder" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sent4hReminder" BOOLEAN NOT NULL DEFAULT false;
