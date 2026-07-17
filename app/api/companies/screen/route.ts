import { NextRequest, NextResponse } from "next/server";
import { compileScreen, evaluateRow } from "@/lib/screener";
import { getScreenUniverse } from "@/lib/yfinance";

// A cold run screens ~500 companies (~1000 Yahoo calls at concurrency 5) and
// can take a few minutes — ask Vercel for more time than the 10-60s default.
// Note: Hobby-tier plans cap function duration at 60s regardless of this
// value, so a cold wide screen may still time out there; Pro plans respect
// it up to their own ceiling.
export const maxDuration = 300;

const MAX_QUERY_LENGTH = 500;
const TARGET_UNIVERSE_COMPANIES = 500;
const PAGE_SIZE = 50;

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q") ?? "";
  const pageParam = Number(request.nextUrl.searchParams.get("page") ?? "1");
  const page = Number.isFinite(pageParam) && pageParam >= 1 ? Math.floor(pageParam) : 1;

  if (!query.trim()) {
    return NextResponse.json({ error: "No query provided" }, { status: 400 });
  }
  if (query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json({ error: `Query is too long (max ${MAX_QUERY_LENGTH} characters)` }, { status: 400 });
  }

  const compiled = compileScreen(query);
  if (!compiled.ok) {
    return NextResponse.json(
      { error: `${compiled.error.message} (at position ${compiled.error.start})`, position: { start: compiled.error.start, end: compiled.error.end } },
      { status: 400 }
    );
  }

  try {
    const { plan } = compiled;
    const universe = await getScreenUniverse(plan.sector?.yahooSector, TARGET_UNIVERSE_COMPANIES);
    const matches = universe
      .filter((c) => evaluateRow(plan.rowAst, c))
      .sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0));

    const totalMatches = matches.length;
    const totalPages = Math.max(1, Math.ceil(totalMatches / PAGE_SIZE));
    const companies = matches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const universeDescription = plan.sector
      ? `top ${universe.length} Indian companies by market cap in ${plan.sector.label}`
      : `top ${universe.length} Indian companies by market cap`;

    return NextResponse.json({
      query,
      sector: plan.sector?.key,
      companies,
      page,
      pageSize: PAGE_SIZE,
      totalMatches,
      totalPages,
      universeSize: universe.length,
      universeDescription,
    });
  } catch (error) {
    console.error(`[/api/companies/screen] Error for query="${query}":`, error);
    return NextResponse.json(
      { error: "Screener data is temporarily unavailable — Yahoo's screener endpoint failed. Try again shortly." },
      { status: 502 }
    );
  }
}
