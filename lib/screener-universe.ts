/**
 * Postgres-backed snapshot of the screener universe (the `ScreenerMetric`
 * table): the global top ~500 Indian companies by market cap with the full
 * peer-metric set, so a screen run is a DB read instead of ~1,000+ live
 * Yahoo calls.
 *
 * Three refresh modes, each on its own cadence (cron-triggered from
 * ai-service via POST /api/admin/refresh-universe):
 * - "quotes": batch quote calls only — price/market-cap columns, cheap
 *   enough for every 15 minutes during market hours.
 * - "full":   ticker discovery + per-company quoteSummary — everything
 *   except the QoQ growth columns, every few hours.
 * - "growth": per-company fundamentalsTimeSeries (the heaviest Yahoo call)
 *   — QoQ growth columns only, daily; fundamentals change quarterly.
 */

import { prisma } from "./db";
import { PEER_COLUMNS } from "./peer-columns";
import {
  assemblePeerMetrics,
  discoverScreenTickers,
  fetchPeerQuoteSummary,
  fetchQuotesBatch,
  getQuarterlyGrowth,
  mapWithConcurrency,
  normalizeCompanyName,
  snapshotRowToPeerMetrics,
  stripInternal,
  SNAPSHOT_TTL_MS,
  type PeerFetchResult,
  type PeerMetrics,
  type QuarterlyGrowth,
} from "./yfinance";

export type RefreshMode = "full" | "quotes" | "growth";

export interface RefreshResult {
  ok: boolean;
  mode: RefreshMode;
  /** Set (with a reason) when the run was a no-op due to the overlap/recency guard. */
  skipped?: string;
  discovered?: number;
  upserted?: number;
  updated?: number;
  pruned?: number;
  failed?: number;
  durationMs: number;
}

const TARGET_UNIVERSE_COMPANIES = 500;
// Background job, so wall-clock matters less than in a request path — but
// Yahoo still rate-limits, so quoteSummary stays moderate and the heavier
// fundamentalsTimeSeries goes lower.
const SUMMARY_CONCURRENCY = 25;
const GROWTH_CONCURRENCY = 10;
const UPSERT_CHUNK_SIZE = 50;
// A completed full refresh this recent makes another one pointless — lets
// overlapping cron fires and stale-triggered background refreshes no-op.
const FULL_REFRESH_MIN_INTERVAL_MS = 10 * 60 * 1000;

const ROOT_SUFFIX_RE = /\.(NS|BO)$/i;

/** Metric columns of ScreenerMetric = the numeric PeerMetrics keys, straight from PEER_COLUMNS. */
type MetricColumnKey = Exclude<keyof PeerMetrics, "symbol" | "name" | "isCurrent">;
type MetricColumns = Partial<Record<MetricColumnKey, number | null>>;

const GROWTH_KEYS: ReadonlySet<string> = new Set(["salesVarQoQ", "profitVarQoQ"]);

function metricColumns(metrics: PeerFetchResult, includeGrowth: boolean): MetricColumns {
  const cols: MetricColumns = {};
  for (const { key } of PEER_COLUMNS) {
    if (!includeGrowth && GROWTH_KEYS.has(key)) continue;
    const value = metrics[key];
    cols[key as MetricColumnKey] = typeof value === "number" ? value : null;
  }
  return cols;
}

/**
 * The screen route's read path: snapshot rows for the (optionally
 * sector-filtered) universe, largest market cap first, in the same
 * `PeerMetrics` shape `getScreenUniverse` returns. `dataAsOf` is the newest
 * full-refresh timestamp among the returned rows (null when the table is
 * empty — caller should fall back to the live path).
 */
export async function readScreenUniverse(
  yahooSector: string | undefined,
  limit = TARGET_UNIVERSE_COMPANIES
): Promise<{ companies: PeerMetrics[]; dataAsOf: Date | null }> {
  const rows = await prisma.screenerMetric.findMany({
    where: yahooSector ? { sector: yahooSector } : undefined,
    orderBy: { marketCap: "desc" },
    take: limit,
  });
  const dataAsOf = rows.reduce<Date | null>(
    (newest, row) => (newest && newest > row.fundamentalsUpdatedAt ? newest : row.fundamentalsUpdatedAt),
    null
  );
  return { companies: rows.map((row) => stripInternal(snapshotRowToPeerMetrics(row))), dataAsOf };
}

export function isSnapshotStale(dataAsOf: Date | null): boolean {
  return !dataAsOf || Date.now() - dataAsOf.getTime() > SNAPSHOT_TTL_MS;
}

// One refresh at a time per instance, whatever the mode — Yahoo fan-out and
// chunked DB writes don't interleave well, and every trigger path (cron,
// stale-serve background kick, manual bootstrap) can fire concurrently.
let refreshInFlight = false;

export async function refreshUniverse(mode: RefreshMode, opts: { includeGrowth?: boolean } = {}): Promise<RefreshResult> {
  const startedAt = Date.now();
  if (refreshInFlight) {
    return { ok: true, mode, skipped: "another refresh is already running", durationMs: 0 };
  }

  if (mode === "full") {
    const newest = await prisma.screenerMetric.aggregate({ _max: { fundamentalsUpdatedAt: true } });
    const last = newest._max.fundamentalsUpdatedAt;
    if (last && Date.now() - last.getTime() < FULL_REFRESH_MIN_INTERVAL_MS) {
      return { ok: true, mode, skipped: "snapshot was fully refreshed within the last 10 minutes", durationMs: 0 };
    }
  }

  refreshInFlight = true;
  try {
    const result =
      mode === "full"
        ? await runFullRefresh(opts.includeGrowth ?? false)
        : mode === "quotes"
          ? await runQuotesRefresh()
          : await runGrowthRefresh();
    return { ...result, durationMs: Date.now() - startedAt };
  } finally {
    refreshInFlight = false;
  }
}

async function runFullRefresh(includeGrowth: boolean): Promise<Omit<RefreshResult, "durationMs">> {
  // Discovery failure throws out of here — the old snapshot stays untouched
  // and the caller reports the error; the next cron tick retries.
  const rawTickers = await discoverScreenTickers(undefined, TARGET_UNIVERSE_COMPANIES);

  // Cheap root-symbol dedup (ABC.NS/ABC.BO) — first occurrence wins, and the
  // raw list is market-cap ordered so that keeps the NSE listing Yahoo ranks.
  const rootsSeen = new Set<string>();
  const tickers: string[] = [];
  for (const ticker of rawTickers) {
    const root = ticker.toUpperCase().replace(ROOT_SUFFIX_RE, "");
    if (rootsSeen.has(root)) continue;
    rootsSeen.add(root);
    tickers.push(ticker);
  }

  const quotes = await fetchQuotesBatch(tickers);

  const nullGrowth: QuarterlyGrowth = { salesVarQoQ: null, profitVarQoQ: null };
  const results = await mapWithConcurrency(tickers, SUMMARY_CONCURRENCY, async (ticker) => {
    const quote = quotes.get(ticker.toUpperCase());
    if (!quote) return null;
    const summary = await fetchPeerQuoteSummary(ticker);
    const growth = includeGrowth ? await getQuarterlyGrowth(ticker) : nullGrowth;
    const metrics = await assemblePeerMetrics(ticker, quote, summary, growth);
    return metrics ? { ticker, metrics } : null;
  });

  // Second dedup by normalized company name — some BSE listings use a numeric
  // scrip-code ticker (e.g. "500325.BO") that shares no root with the NSE
  // twin. Market-cap order first so the dedup keeps the primary listing.
  const resolved = results
    .filter((r): r is { ticker: string; metrics: PeerFetchResult } => r != null && !!r.metrics.marketCap && r.metrics.marketCap > 0)
    .sort((a, b) => (b.metrics.marketCap ?? 0) - (a.metrics.marketCap ?? 0));
  const namesSeen = new Set<string>();
  const companies = resolved
    .filter(({ metrics }) => {
      const key = normalizeCompanyName(metrics.name);
      if (namesSeen.has(key)) return false;
      namesSeen.add(key);
      return true;
    })
    .slice(0, TARGET_UNIVERSE_COMPANIES);

  const now = new Date();
  let upserted = 0;
  for (let i = 0; i < companies.length; i += UPSERT_CHUNK_SIZE) {
    const chunk = companies.slice(i, i + UPSERT_CHUNK_SIZE);
    await prisma.$transaction(
      chunk.map(({ ticker, metrics }) => {
        const data = {
          yahooTicker: ticker,
          name: metrics.name,
          sector: metrics.sector ?? null,
          industry: metrics.industry ?? null,
          ...metricColumns(metrics, includeGrowth),
          fundamentalsUpdatedAt: now,
          quotesUpdatedAt: now,
          ...(includeGrowth ? { growthUpdatedAt: now } : {}),
        };
        return prisma.screenerMetric.upsert({
          where: { symbol: metrics.symbol },
          create: { symbol: metrics.symbol, ...data },
          update: data,
        });
      })
    );
    upserted += chunk.length;
  }

  // Prune companies that dropped out of the top-N — membership comes from
  // *discovery* (rootsSeen), not from fetch success, so a transient
  // quoteSummary failure keeps its stale row instead of evicting the company.
  const { count: pruned } = await prisma.screenerMetric.deleteMany({
    where: { symbol: { notIn: Array.from(rootsSeen) } },
  });

  return {
    ok: true,
    mode: "full",
    discovered: tickers.length,
    upserted,
    pruned,
    failed: tickers.length - resolved.length,
  };
}

async function runQuotesRefresh(): Promise<Omit<RefreshResult, "durationMs">> {
  const rows = await prisma.screenerMetric.findMany({ select: { symbol: true, yahooTicker: true } });
  if (rows.length === 0) {
    return { ok: true, mode: "quotes", skipped: "snapshot is empty — run a full refresh first", updated: 0 };
  }

  const quotes = await fetchQuotesBatch(rows.map((r) => r.yahooTicker));
  const now = new Date();
  let updated = 0;

  for (let i = 0; i < rows.length; i += UPSERT_CHUNK_SIZE) {
    const chunk = rows.slice(i, i + UPSERT_CHUNK_SIZE);
    const updates = chunk.flatMap((row) => {
      const quote = quotes.get(row.yahooTicker.toUpperCase());
      if (!quote || quote.regularMarketPrice == null) return [];
      // The union quote type only guarantees equity fields on some variants.
      const q = quote as typeof quote & { trailingPE?: number; epsTrailingTwelveMonths?: number };
      return [
        prisma.screenerMetric.update({
          where: { symbol: row.symbol },
          data: {
            price: q.regularMarketPrice,
            changePercent: q.regularMarketChangePercent ?? null,
            marketCap: q.marketCap ?? null,
            fiftyTwoWeekHigh: q.fiftyTwoWeekHigh ?? null,
            fiftyTwoWeekLow: q.fiftyTwoWeekLow ?? null,
            peRatio: q.trailingPE ?? null,
            trailingEps: q.epsTrailingTwelveMonths ?? null,
            quotesUpdatedAt: now,
          },
        }),
      ];
    });
    if (updates.length > 0) await prisma.$transaction(updates);
    updated += updates.length;
  }

  return { ok: true, mode: "quotes", updated, failed: rows.length - updated };
}

async function runGrowthRefresh(): Promise<Omit<RefreshResult, "durationMs">> {
  const rows = await prisma.screenerMetric.findMany({ select: { symbol: true, yahooTicker: true } });
  if (rows.length === 0) {
    return { ok: true, mode: "growth", skipped: "snapshot is empty — run a full refresh first", updated: 0 };
  }

  const now = new Date();
  const results = await mapWithConcurrency(rows, GROWTH_CONCURRENCY, async (row) => ({
    symbol: row.symbol,
    growth: await getQuarterlyGrowth(row.yahooTicker),
  }));

  // `getQuarterlyGrowth` can't distinguish "no data" from "fetch failed" (both
  // yield nulls), so an all-null result leaves the row untouched — never
  // overwrite real QoQ values with nulls on a transient failure. Rows that
  // genuinely have no quarterly data were null before and stay null.
  const withData = results.filter((r) => r.growth.salesVarQoQ != null || r.growth.profitVarQoQ != null);

  let updated = 0;
  for (let i = 0; i < withData.length; i += UPSERT_CHUNK_SIZE) {
    const chunk = withData.slice(i, i + UPSERT_CHUNK_SIZE);
    await prisma.$transaction(
      chunk.map(({ symbol, growth }) =>
        prisma.screenerMetric.update({
          where: { symbol },
          data: {
            salesVarQoQ: growth.salesVarQoQ,
            profitVarQoQ: growth.profitVarQoQ,
            growthUpdatedAt: now,
          },
        })
      )
    );
    updated += chunk.length;
  }

  return { ok: true, mode: "growth", updated, failed: rows.length - updated };
}
