-- CreateTable
CREATE TABLE "TrakingView" (
    "id" UUID NOT NULL,
    "ip" TEXT NOT NULL,
    "country" VARCHAR(100),
    "countryName" VARCHAR(100),
    "url" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userAgent" TEXT,
    "referrer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrakingView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TrakingView_createdAt_idx" ON "TrakingView"("createdAt");

-- CreateIndex
CREATE INDEX "TrakingView_url_idx" ON "TrakingView"("url");

-- CreateIndex
CREATE INDEX "TrakingView_sessionId_idx" ON "TrakingView"("sessionId");
