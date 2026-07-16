-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "bestAsks" JSONB,
ADD COLUMN     "bestBids" JSONB,
ADD COLUMN     "lowerCircuitLimit" DOUBLE PRECISION,
ADD COLUMN     "openInterest" DOUBLE PRECISION,
ADD COLUMN     "tickSource" TEXT,
ADD COLUMN     "totalBuyQuantity" DOUBLE PRECISION,
ADD COLUMN     "totalSellQuantity" DOUBLE PRECISION,
ADD COLUMN     "upperCircuitLimit" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "InstrumentToken" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "exchange" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "exchangeType" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstrumentToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InstrumentToken_symbol_exchange_key" ON "InstrumentToken"("symbol", "exchange");
