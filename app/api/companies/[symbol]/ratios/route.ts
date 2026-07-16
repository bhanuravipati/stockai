import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getFinancialRatios } from "@/lib/yfinance";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    console.log(`[/api/ratios] Fetching for symbol: ${symbol}`);

    const company = await prisma.company.findUnique({ where: { symbol } });
    const exchange = company?.exchange || (symbol.includes(".") ? undefined : "NSE");

    const ratios = await getFinancialRatios(symbol, exchange);

    return NextResponse.json({ ratios });
  } catch (error) {
    console.error("[/api/ratios] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
