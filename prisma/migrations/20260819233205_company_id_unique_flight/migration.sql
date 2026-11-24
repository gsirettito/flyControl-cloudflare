/*
  Warnings:

  - A unique constraint covering the columns `[companyId,airline_id,flight_number,departure_time,class]` on the table `flights` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "flights_airline_id_flight_number_departure_time_class_key";

-- CreateIndex
CREATE UNIQUE INDEX "flights_companyId_airline_id_flight_number_departure_time_c_key" ON "flights"("companyId", "airline_id", "flight_number", "departure_time", "class");
