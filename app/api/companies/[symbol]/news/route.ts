import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { triggerScrape } from "@/lib/ai-service-client";
import { getCompanyNews } from "@/lib/yfinance";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const limit = Number(request.nextUrl.searchParams.get("limit")) || 15;

    console.log(`[/api/news] Fetching for symbol: ${symbol}, limit: ${limit}`);

    const company = await prisma.company.findUnique({
      where: { symbol: symbol.toUpperCase() },
    });

    const cached = company
      ? await prisma.newsItem.findMany({
          where: { companyId: company.id },
          orderBy: { publishedAt: "desc" },
          take: limit,
        })
      : [];

    if (cached.length > 0) {
      return NextResponse.json({ articles: cached });
    }

    // No cached data yet — fetch live from Yahoo Finance so the tab isn't blank,
    // and trigger an async backfill for next time.
    if (company) {
      triggerScrape(symbol, "news");
    }

    const exchange = company?.exchange || (symbol.includes(".") ? undefined : "NSE");
    const articles = await getCompanyNews(symbol, exchange, limit);

    return NextResponse.json({ articles, refreshing: articles.length === 0 });
  } catch (error) {
    console.error("[/api/news] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
