import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPriceCagr } from "@/lib/yfinance";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;

    const company = await prisma.company.findUnique({ where: { symbol } });
    const exchange = company?.exchange || (symbol.includes(".") ? undefined : "NSE");

    const cagr = await getPriceCagr(symbol, exchange);

    return NextResponse.json({ cagr });
  } catch (error) {
    console.error("[/api/cagr] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
