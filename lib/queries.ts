import { cache } from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";

export const getCompanyBySymbol = cache(async (symbol: string) => {
  const company = await prisma.company.findUnique({
    where: { symbol: symbol.toUpperCase() },
    include: { quote: true },
  });
  if (!company) notFound();
  return company;
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
