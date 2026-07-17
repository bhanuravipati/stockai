import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getMultiCompanyMetrics, getYahooTicker, type PeerMetrics } from "@/lib/yfinance";

const MAX_SYMBOLS = 10;

export async function GET(request: NextRequest) {
  try {
    const raw = request.nextUrl.searchParams.get("symbols") ?? "";
    const symbols = Array.from(
      new Set(
        raw
          .split(",")
          .map((s) => s.trim().toUpperCase())
          .filter(Boolean)
      )
    );

    if (symbols.length === 0) {
      return NextResponse.json({ error: "No symbols provided" }, { status: 400 });
    }
    if (symbols.length > MAX_SYMBOLS) {
      return NextResponse.json({ error: `Too many symbols (max ${MAX_SYMBOLS})` }, { status: 400 });
    }

    const dbCompanies = await prisma.company.findMany({ where: { symbol: { in: symbols } } });
    const exchangeBySymbol = new Map(dbCompanies.map((c) => [c.symbol, c.exchange]));

    const tickers = symbols.map((symbol) =>
      getYahooTicker(symbol, exchangeBySymbol.get(symbol) || (symbol.includes(".") ? undefined : "NSE"))
    );

    const results = await getMultiCompanyMetrics(tickers);

    const companies: PeerMetrics[] = [];
    const failed: string[] = [];
    results.forEach((metrics, i) => {
      if (metrics) {
        companies.push(metrics);
      } else {
        failed.push(symbols[i]);
      }
    });

    return NextResponse.json({ companies, failed });
  } catch (error) {
    console.error("[/api/companies/compare] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
