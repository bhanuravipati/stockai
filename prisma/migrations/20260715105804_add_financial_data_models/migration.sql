-- CreateEnum
CREATE TYPE "PeriodType" AS ENUM ('ANNUAL', 'QUARTERLY');

-- CreateEnum
CREATE TYPE "InsightType" AS ENUM ('SWOT', 'FINANCIAL_SUMMARY', 'NEWS_DIGEST');

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "change" DOUBLE PRECISION,
    "changePercent" DOUBLE PRECISION,
    "dayHigh" DOUBLE PRECISION,
    "dayLow" DOUBLE PRECISION,
    "fiftyTwoWeekHigh" DOUBLE PRECISION,
    "fiftyTwoWeekLow" DOUBLE PRECISION,
    "volume" BIGINT,
    "marketCap" BIGINT,
    "currency" TEXT,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceHistory" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "open" DOUBLE PRECISION NOT NULL,
    "high" DOUBLE PRECISION NOT NULL,
    "low" DOUBLE PRECISION NOT NULL,
    "close" DOUBLE PRECISION NOT NULL,
    "volume" BIGINT,

    CONSTRAINT "PriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialStatement" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "periodType" "PeriodType" NOT NULL,
    "periodEndDate" TIMESTAMP(3) NOT NULL,
    "revenue" DOUBLE PRECISION,
    "netIncome" DOUBLE PRECISION,
    "grossProfit" DOUBLE PRECISION,
    "operatingIncome" DOUBLE PRECISION,
    "totalAssets" DOUBLE PRECISION,
    "totalLiabilities" DOUBLE PRECISION,
    "stockholdersEquity" DOUBLE PRECISION,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialStatement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialRatio" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "peRatio" DOUBLE PRECISION,
    "priceToBook" DOUBLE PRECISION,
    "debtToEquity" DOUBLE PRECISION,
    "roe" DOUBLE PRECISION,
    "roa" DOUBLE PRECISION,
    "currentRatio" DOUBLE PRECISION,
    "quickRatio" DOUBLE PRECISION,
    "profitMargin" DOUBLE PRECISION,
    "operatingMargin" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinancialRatio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeerRelation" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "peerCompanyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PeerRelation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsItem" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "externalId" TEXT,
    "title" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "source" TEXT,
    "summary" TEXT,
    "publishedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIInsight" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" "InsightType" NOT NULL,
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIInsight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Quote_companyId_key" ON "Quote"("companyId");

-- CreateIndex
CREATE INDEX "PriceHistory_companyId_date_idx" ON "PriceHistory"("companyId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "PriceHistory_companyId_date_key" ON "PriceHistory"("companyId", "date");

-- CreateIndex
CREATE INDEX "FinancialStatement_companyId_periodType_idx" ON "FinancialStatement"("companyId", "periodType");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialStatement_companyId_periodType_periodEndDate_key" ON "FinancialStatement"("companyId", "periodType", "periodEndDate");

-- CreateIndex
CREATE INDEX "FinancialRatio_companyId_createdAt_idx" ON "FinancialRatio"("companyId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PeerRelation_companyId_peerCompanyId_key" ON "PeerRelation"("companyId", "peerCompanyId");

-- CreateIndex
CREATE INDEX "NewsItem_companyId_publishedAt_idx" ON "NewsItem"("companyId", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "NewsItem_companyId_link_key" ON "NewsItem"("companyId", "link");

-- CreateIndex
CREATE UNIQUE INDEX "AIInsight_companyId_type_key" ON "AIInsight"("companyId", "type");

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceHistory" ADD CONSTRAINT "PriceHistory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialStatement" ADD CONSTRAINT "FinancialStatement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialRatio" ADD CONSTRAINT "FinancialRatio_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeerRelation" ADD CONSTRAINT "PeerRelation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeerRelation" ADD CONSTRAINT "PeerRelation_peerCompanyId_fkey" FOREIGN KEY ("peerCompanyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsItem" ADD CONSTRAINT "NewsItem_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AIInsight" ADD CONSTRAINT "AIInsight_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
