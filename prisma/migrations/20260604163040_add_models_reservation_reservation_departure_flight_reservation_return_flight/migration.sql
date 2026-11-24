-- CreateEnum
CREATE TYPE "TripType" AS ENUM ('ONE_WAY', 'ROUND_TRIP');

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED');

-- CreateTable
CREATE TABLE "reservation_departure_flights" (
    "reservationId" TEXT NOT NULL,
    "flightId" TEXT NOT NULL,

    CONSTRAINT "reservation_departure_flights_pkey" PRIMARY KEY ("reservationId","flightId")
);

-- CreateTable
CREATE TABLE "reservation_return_flights" (
    "reservationId" TEXT NOT NULL,
    "flightId" TEXT NOT NULL,

    CONSTRAINT "reservation_return_flights_pkey" PRIMARY KEY ("reservationId","flightId")
);

-- CreateTable
CREATE TABLE "reservations" (
    "id" TEXT NOT NULL,
    "reservationCode" TEXT NOT NULL,
    "tripType" "TripType" NOT NULL,
    "passenger_id" TEXT NOT NULL,
    "created_by_user_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "baggage" TEXT NOT NULL,
    "invoice_amount" DOUBLE PRECISION,
    "invoice_currency" TEXT,
    "status" "ReservationStatus" NOT NULL DEFAULT 'PENDING',
    "pnr" TEXT,
    "ticket_number" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reservations_reservationCode_key" ON "reservations"("reservationCode");

-- CreateIndex
CREATE INDEX "reservations_reservationCode_idx" ON "reservations"("reservationCode");

-- CreateIndex
CREATE INDEX "reservations_passenger_id_idx" ON "reservations"("passenger_id");

-- CreateIndex
CREATE INDEX "reservations_created_by_user_id_idx" ON "reservations"("created_by_user_id");

-- CreateIndex
CREATE INDEX "reservations_company_id_idx" ON "reservations"("company_id");

-- CreateIndex
CREATE INDEX "reservations_status_idx" ON "reservations"("status");

-- AddForeignKey
ALTER TABLE "reservation_departure_flights" ADD CONSTRAINT "reservation_departure_flights_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_departure_flights" ADD CONSTRAINT "reservation_departure_flights_flightId_fkey" FOREIGN KEY ("flightId") REFERENCES "flights"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_return_flights" ADD CONSTRAINT "reservation_return_flights_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservation_return_flights" ADD CONSTRAINT "reservation_return_flights_flightId_fkey" FOREIGN KEY ("flightId") REFERENCES "flights"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_passenger_id_fkey" FOREIGN KEY ("passenger_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
