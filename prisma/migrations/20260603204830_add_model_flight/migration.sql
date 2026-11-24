-- CreateEnum
CREATE TYPE "FlightClass" AS ENUM ('ECONOMY', 'BUSINESS', 'FIRST');

-- CreateTable
CREATE TABLE "flights" (
    "id" TEXT NOT NULL,
    "flight_number" TEXT NOT NULL,
    "airline_id" TEXT NOT NULL,
    "departure_time" TIMESTAMP(3) NOT NULL,
    "arrival_time" TIMESTAMP(3) NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "class" "FlightClass" NOT NULL,
    "available_seats" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flights_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "flights_departure_time_idx" ON "flights"("departure_time");

-- CreateIndex
CREATE INDEX "flights_origin_destination_idx" ON "flights"("origin", "destination");

-- CreateIndex
CREATE INDEX "flights_airline_id_idx" ON "flights"("airline_id");

-- CreateIndex
CREATE UNIQUE INDEX "flights_airline_id_flight_number_departure_time_class_key" ON "flights"("airline_id", "flight_number", "departure_time", "class");

-- AddForeignKey
ALTER TABLE "flights" ADD CONSTRAINT "flights_airline_id_fkey" FOREIGN KEY ("airline_id") REFERENCES "airlines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
