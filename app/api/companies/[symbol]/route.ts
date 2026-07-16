import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  getQuote,
  getPriceHistory,
  getCompanyInfo,
} from "@/lib/yfinance";

// A cached Quote row counts as "live" if it was written by the Angel One
// stream within this window. Outside that window (or from any other
// source) we fall back to the existing live Yahoo Finance fetch below —
// this must never become a hard dependency on Angel One being enabled.
const LIVE_QUOTE_FRESHNESS_MS = 10_000;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    console.log(`[/api/companies] Fetching data for symbol: ${symbol}`);

    // Get company from DB (master list cache) - optional
    const company = await prisma.company.findUnique({
      where: { symbol },
      include: { quote: true },
    });

    // Determine exchange: use DB value or default to NSE for symbols without suffix
    const exchange = company?.exchange || (symbol.includes(".") ? undefined : "NSE");

    console.log(`[/api/companies] Using exchange: ${exchange}`);

    const cachedQuote = company?.quote;
    const isFreshLiveQuote =
      cachedQuote?.tickSource === "angelone" &&
      Date.now() - cachedQuote.fetchedAt.getTime() < LIVE_QUOTE_FRESHNESS_MS;

    // Live-stream cache hit: skip the Yahoo Finance quote call entirely and
    // use the fresh Angel One tick already in Postgres. History/company
    // info aren't part of the live feed, so those still come from Yahoo.
    const [quote, history, info] = await Promise.all([
      isFreshLiveQuote ? Promise.resolve(cachedQuote) : getQuote(symbol, exchange),
      getPriceHistory(symbol, 365, exchange),
      getCompanyInfo(symbol, exchange),
    ]);

    console.log(`[/api/companies] Quote source:`, isFreshLiveQuote ? "angelone-cache" : "yahoo-live");
    console.log(`[/api/companies] History length:`, history?.length);
    console.log(`[/api/companies] Info result:`, info);

    if (!quote) {
      console.error(`[/api/companies] Failed to fetch quote for ${symbol}`);
      return NextResponse.json(
        { error: "Unable to fetch stock data from Yahoo Finance" },
        { status: 503 }
      );
    }

    const quoteResponse = isFreshLiveQuote
      ? {
          symbol,
          price: cachedQuote.price,
          change: cachedQuote.change,
          changePercent: cachedQuote.changePercent,
          dayHigh: cachedQuote.dayHigh,
          dayLow: cachedQuote.dayLow,
          fiftyTwoWeekHigh: cachedQuote.fiftyTwoWeekHigh,
          fiftyTwoWeekLow: cachedQuote.fiftyTwoWeekLow,
          volume: cachedQuote.volume != null ? Number(cachedQuote.volume) : undefined,
          marketCap: cachedQuote.marketCap != null ? Number(cachedQuote.marketCap) : undefined,
          currency: cachedQuote.currency ?? "INR",
          totalBuyQuantity: cachedQuote.totalBuyQuantity,
          totalSellQuantity: cachedQuote.totalSellQuantity,
          upperCircuitLimit: cachedQuote.upperCircuitLimit,
          lowerCircuitLimit: cachedQuote.lowerCircuitLimit,
          openInterest: cachedQuote.openInterest,
          bestBids: cachedQuote.bestBids,
          bestAsks: cachedQuote.bestAsks,
          source: "angelone" as const,
        }
      : { ...quote, source: "yahoo" as const };

    return NextResponse.json({
      company: company ? {
        ...company,
        quote: undefined,
      } : {
        symbol,
        name: info?.name || symbol,
        exchange: symbol.includes(".BO") ? "BSE" : "NSE",
        sector: info?.sector || null,
        logoUrl: null,
      },
      quote: quoteResponse,
      history,
      info,
    });
  } catch (error) {
    console.error("[/api/companies] API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
