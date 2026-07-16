import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPriceHistoryRange, PRICE_RANGES, type PriceRange } from "@/lib/yfinance";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const rangeParam = request.nextUrl.searchParams.get("range") || "1Y";
    const range = (PRICE_RANGES as readonly string[]).includes(rangeParam)
      ? (rangeParam as PriceRange)
      : "1Y";

    const company = await prisma.company.findUnique({ where: { symbol } });
    const exchange = company?.exchange || (symbol.includes(".") ? undefined : "NSE");

    const history = await getPriceHistoryRange(symbol, range, exchange);

    return NextResponse.json({ history, range });
  } catch (error) {
    console.error("[/api/history] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
