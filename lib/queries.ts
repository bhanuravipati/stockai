import { cache } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getQuote, getCompanyInfo, type StockQuote } from "@/lib/yfinance";
import type { Company } from "@/lib/generated/prisma/client";

export const getCompanyBySymbol = cache(async (symbol: string) => {
  const company = await prisma.company.findUnique({
    where: { symbol: symbol.toUpperCase() },
    include: { quote: true },
  });
  if (!company) notFound();
  return company;
});

export interface ResolvedCompany {
  company: Company | null;
  quote: StockQuote | null;
  /** Best-available name for the page title when `company` is null. */
  fallbackName: string | null;
  error: string | null;
}

/**
 * Resolves a company for the `/company/[symbol]` layout — DB lookup, and on
 * a cache miss, a live Yahoo fetch + upsert so sub-tabs have a `Company` row
 * to attach to. Wrapped in React's `cache()` so `generateMetadata` and the
 * layout body (which both need this) share one result per request instead
 * of each independently hitting Postgres and Yahoo — `cache()` is the
 * documented fix for exactly this: it only dedupes `fetch()` calls
 * automatically, not raw Prisma/SDK calls like the ones here.
 */
export const resolveCompanyForLayout = cache(async (symbol: string): Promise<ResolvedCompany> => {
  try {
    const existing = await prisma.company.findUnique({ where: { symbol } });

    if (existing) {
      const quote = await getQuote(existing.symbol, existing.exchange);
      return { company: existing, quote, fallbackName: existing.name, error: null };
    }

    const [quote, info] = await Promise.all([getQuote(symbol), getCompanyInfo(symbol)]);

    if (!quote) {
      return { company: null, quote: null, fallbackName: info?.name ?? null, error: null };
    }

    const exchange = symbol.includes(".BO") ? "BSE" : "NSE";
    const company = await prisma.company.upsert({
      where: { symbol },
      create: {
        symbol,
        name: info?.name || symbol,
        exchange,
        sector: info?.sector || null,
      },
      update: {},
    });

    return { company, quote, fallbackName: company.name, error: null };
  } catch (error) {
    console.error(`[resolveCompanyForLayout] Error resolving ${symbol}:`, error);
    return {
      company: null,
      quote: null,
      fallbackName: null,
      error: error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
});

export function getAnnualStatements(companyId: string) {
  return prisma.financialStatement.findMany({
    where: { companyId, periodType: "ANNUAL" },
    orderBy: { periodEndDate: "asc" },
  });
}

export function getQuarterlyStatements(companyId: string) {
  return prisma.financialStatement.findMany({
    where: { companyId, periodType: "QUARTERLY" },
    orderBy: { periodEndDate: "asc" },
  });
}

export function getLatestRatio(companyId: string) {
  return prisma.financialRatio.findFirst({
    where: { companyId },
    orderBy: { createdAt: "desc" },
  });
}

export function getPeers(companyId: string) {
  return prisma.peerRelation.findMany({
    where: { companyId },
    include: { peerCompany: { include: { quote: true, ratios: { orderBy: { createdAt: "desc" }, take: 1 } } } },
  });
}

export function getNews(companyId: string) {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  return prisma.newsItem.findMany({
    where: { companyId, publishedAt: { gte: oneYearAgo } },
    orderBy: { publishedAt: "desc" },
  });
}

export function getInsight(companyId: string, type: "SWOT" | "FINANCIAL_SUMMARY" | "NEWS_DIGEST") {
  return prisma.aIInsight.findUnique({
    where: { companyId_type: { companyId, type } },
  });
}

export function getPriceHistory(companyId: string, days = 365) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  return prisma.priceHistory.findMany({
    where: { companyId, date: { gte: since } },
    orderBy: { date: "asc" },
  });
}
