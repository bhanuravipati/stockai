import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Curated symbols only — this endpoint exists to make one Learn widget feel
 * real, not to expose arbitrary screener lookups. Never widen this to accept
 * caller-supplied symbols outside this list.
 */
const ALLOWED_SYMBOLS = ["RELIANCE", "TCS", "INFY", "HDFCBANK"];

export interface LearnMetricRow {
  symbol: string;
  name: string;
  price: number | null;
  trailingEps: number | null;
}

export async function GET(request: NextRequest) {
  const requested = (request.nextUrl.searchParams.get("symbols") ?? "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s) => ALLOWED_SYMBOLS.includes(s));

  const symbols = requested.length > 0 ? requested : ALLOWED_SYMBOLS;

  try {
    const rows = await prisma.screenerMetric.findMany({
      where: { symbol: { in: symbols } },
      select: { symbol: true, name: true, price: true, trailingEps: true },
    });
    const results: LearnMetricRow[] = rows.map((r) => ({
      symbol: r.symbol,
      name: r.name,
      price: r.price,
      trailingEps: r.trailingEps,
    }));
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] });
  }
}
