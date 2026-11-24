-- CreateTable
CREATE TABLE "airlines" (
    "id" TEXT NOT NULL,
    "iata" TEXT NOT NULL,
    "icao" TEXT NOT NULL,
    "official_name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "logo_url" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "airlines_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "airlines_iata_key" ON "airlines"("iata");

-- CreateIndex
CREATE UNIQUE INDEX "airlines_icao_key" ON "airlines"("icao");

-- CreateIndex
CREATE INDEX "airlines_iata_idx" ON "airlines"("iata");

-- CreateIndex
CREATE INDEX "airlines_icao_idx" ON "airlines"("icao");

-- CreateIndex
CREATE INDEX "airlines_active_idx" ON "airlines"("active");
