import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPeerComparison } from "@/lib/yfinance";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    console.log(`[/api/peers] Fetching for symbol: ${symbol}`);

    const company = await prisma.company.findUnique({ where: { symbol } });
    const exchange = company?.exchange || (symbol.includes(".") ? undefined : "NSE");

    const comparison = await getPeerComparison(symbol, exchange);

    if (!comparison.companies || comparison.companies.length <= 1) {
      return NextResponse.json(
        { error: "No peer data available", sector: comparison.sector, industry: comparison.industry, companies: comparison.companies ?? [] },
        { status: 404 }
      );
    }

    return NextResponse.json(comparison);
  } catch (error) {
    console.error("[/api/peers] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
