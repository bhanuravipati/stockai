import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { compileScreen, evaluateRow } from "@/lib/screener";
import { getScreenUniverse } from "@/lib/yfinance";
import { isSnapshotStale, readScreenUniverse, refreshUniverse } from "@/lib/screener-universe";

// Normally a fast DB read of the ScreenerMetric snapshot. The 60s headroom is
// for the empty-snapshot fallback only, which live-fetches the universe from
// Yahoo (first boot / truncated table) — that path can exceed it on Vercel
// Hobby, but recovers permanently once the background refresh lands.
export const maxDuration = 60;

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
    const needsGrowth = plan.metricKeys.includes("salesVarQoQ") || plan.metricKeys.includes("profitVarQoQ");

    // Snapshot-first: the normal path is a pure Postgres read. Never block on
    // freshness — a stale snapshot is served as-is and refreshed after the
    // response; an empty one (first boot) falls back to the legacy live
    // Yahoo path once while the background refresh populates the table.
    const snapshot = await readScreenUniverse(plan.sector?.yahooSector, TARGET_UNIVERSE_COMPANIES);
    let universe = snapshot.companies;
    const dataAsOf = snapshot.dataAsOf;

    if (universe.length === 0) {
      after(() => refreshUniverse("full", { includeGrowth: true }).catch((e) => console.error("[screen] background refresh failed:", e)));
      universe = await getScreenUniverse(plan.sector?.yahooSector, TARGET_UNIVERSE_COMPANIES, needsGrowth);
    } else if (isSnapshotStale(dataAsOf)) {
      after(() => refreshUniverse("full").catch((e) => console.error("[screen] background refresh failed:", e)));
    }

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
      dataAsOf: dataAsOf?.toISOString() ?? null,
    });
  } catch (error) {
    console.error(`[/api/companies/screen] Error for query="${query}":`, error);
    return NextResponse.json(
      { error: "Screener data is temporarily unavailable — Yahoo's screener endpoint failed. Try again shortly." },
      { status: 502 }
    );
  }
}
