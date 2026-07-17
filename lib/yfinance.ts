/**
 * yfinance wrapper for Indian stocks (NSE/BSE).
 * Yahoo Finance uses .NS (NSE) and .BO (BSE) suffixes for Indian stocks.
 */

import YahooFinance from "yahoo-finance2";
import { PRICE_RANGES, type PriceRange } from "./price-range";

export { PRICE_RANGES, type PriceRange };

const yahooFinance = new YahooFinance();

// Cache symbols for 1 hour to reduce API calls
const symbolCache = new Map<string, number>();
const CACHE_TTL = 60 * 60 * 1000;

// No Yahoo Finance call in this file had a timeout before — a stalled
// (not erroring, just hanging) upstream response would hang the request
// indefinitely. `AbortSignal.timeout()` must be created fresh per call
// (a signal fires once, permanently, after its window) — `withTimeout()`
// is a function for exactly that reason, never a shared constant.
const YAHOO_TIMEOUT_MS = 8000;
function withTimeout(): { fetchOptions: { signal: AbortSignal } } {
  return { fetchOptions: { signal: AbortSignal.timeout(YAHOO_TIMEOUT_MS) } };
}

/**
 * Retries `fn` once after a short delay on a transient failure. Skips retrying
 * our own timeout aborts — retrying a call that just took the full 8s to
 * time out would double the wait for a request that's already failing slowly,
 * which is worse for a customer than failing fast. A network blip or a
 * stale-crumb 4xx (which self-heals: the crumb gets invalidated before the
 * throw, so the retried call picks up a fresh one) both fail fast, so one
 * quick retry is cheap insurance against silently dropping a result.
 */
async function withRetry<T>(fn: () => Promise<T>, delayMs = 300): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    return fn();
  }
}

export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  dayHigh?: number;
  dayLow?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  volume?: number;
  marketCap?: number;
  currency?: string;
}

export interface StockHistory {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

// Intraday ranges plot several points per day, so the chart needs the full
// timestamp (not just the date) to place/format them correctly.
const INTRADAY_RANGES: PriceRange[] = ["1D", "1W"];

const RANGE_CONFIG: Record<
  PriceRange,
  { periodStart: (now: Date) => Date; interval: "5m" | "30m" | "1d" | "1wk" | "1mo" }
> = {
  "1D": { periodStart: (now) => addDays(now, -5), interval: "5m" },
  "1W": { periodStart: (now) => addDays(now, -7), interval: "30m" },
  "1M": { periodStart: (now) => addMonths(now, -1), interval: "1d" },
  "6M": { periodStart: (now) => addMonths(now, -6), interval: "1d" },
  "1Y": { periodStart: (now) => addMonths(now, -12), interval: "1d" },
  "3Y": { periodStart: (now) => addMonths(now, -36), interval: "1d" },
  "5Y": { periodStart: (now) => addMonths(now, -60), interval: "1wk" },
  "10Y": { periodStart: (now) => addMonths(now, -120), interval: "1wk" },
  // Yahoo clamps period1 to whatever history actually exists for the
  // symbol, so a fixed far-past date is enough to get the full series.
  MAX: { periodStart: () => new Date("1990-01-01"), interval: "1mo" },
};

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

/**
 * Get the Yahoo Finance ticker symbol for an Indian stock.
 * Uses exchange to construct the suffix, defaults to NSE (.NS).
 * Handles symbols that already have exchange suffixes.
 */
export function getYahooTicker(
  symbol: string,
  exchange?: string
): string {
  // If symbol already has a suffix (.NS, .BO), return as-is
  if (symbol.includes(".")) {
    return symbol;
  }

  // Use exchange to determine suffix, default to NSE (.NS)
  if (exchange?.toUpperCase() === "BSE" || exchange?.toUpperCase() === "BO") {
    return `${symbol}.BO`;
  }
  return `${symbol}.NS`;
}

/**
 * Fetch current stock quote for an Indian company.
 */
export async function getQuote(symbol: string, exchange?: string): Promise<StockQuote | null> {
  try {
    const ticker = getYahooTicker(symbol, exchange);

    const quote = await withRetry(() => yahooFinance.quote(ticker, {}, withTimeout()));

    if (!quote || quote.regularMarketPrice == null) {
      return null;
    }

    return {
      symbol: symbol,
      price: Math.round(quote.regularMarketPrice * 100) / 100,
      change: quote.regularMarketChange ?? 0,
      changePercent: quote.regularMarketChangePercent ?? 0,
      dayHigh: quote.regularMarketDayHigh,
      dayLow: quote.regularMarketDayLow,
      fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: quote.fiftyTwoWeekLow,
      volume: quote.volume,
      marketCap: quote.marketCap,
      currency: quote.currency,
    };
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch historical price data (OHLCV) for the last year.
 */
export async function getPriceHistory(
  symbol: string,
  days: number = 365,
  exchange?: string
): Promise<StockHistory[]> {
  try {
    const ticker = getYahooTicker(symbol, exchange);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const result = await withRetry(() =>
      yahooFinance.historical(
        ticker,
        {
          period1: startDate,
          period2: endDate,
          interval: "1d",
        },
        withTimeout()
      )
    );

    return (result || [])
      .map((bar) => ({
        date: new Date(bar.date).toISOString().split("T")[0],
        open: Math.round(bar.open * 100) / 100,
        high: Math.round(bar.high * 100) / 100,
        low: Math.round(bar.low * 100) / 100,
        close: Math.round(bar.close * 100) / 100,
        volume: bar.volume,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch (error) {
    console.error(`Error fetching price history for ${symbol}:`, error);
    return [];
  }
}

/**
 * Fetch historical price data (OHLCV) for a named range (1D through MAX),
 * used by the timeframe selector on the price chart. Intraday ranges
 * (1D/1W) return one point per bar with a full timestamp; everything else
 * returns one point per calendar day/week/month.
 */
export async function getPriceHistoryRange(
  symbol: string,
  range: PriceRange,
  exchange?: string
): Promise<StockHistory[]> {
  try {
    const ticker = getYahooTicker(symbol, exchange);
    const { periodStart, interval } = RANGE_CONFIG[range];
    const isIntraday = INTRADAY_RANGES.includes(range);

    const result = await withRetry(() =>
      yahooFinance.chart(
        ticker,
        {
          period1: periodStart(new Date()),
          period2: new Date(),
          interval,
        },
        withTimeout()
      )
    );

    let bars = (result?.quotes || []).filter(
      (bar): bar is typeof bar & { open: number; high: number; low: number; close: number } =>
        bar.open != null && bar.high != null && bar.low != null && bar.close != null
    );

    // "1D" fetches a few days of 5m bars (Yahoo/NSE intraday history is
    // patchy right at the edges) so we can reliably find the latest
    // session, then trim down to just that one trading day.
    if (range === "1D" && bars.length > 0) {
      const lastDay = new Date(bars[bars.length - 1].date).toDateString();
      bars = bars.filter((bar) => new Date(bar.date).toDateString() === lastDay);
    }

    return bars
      .map((bar) => ({
        date: isIntraday ? new Date(bar.date).toISOString() : new Date(bar.date).toISOString().split("T")[0],
        open: Math.round(bar.open * 100) / 100,
        high: Math.round(bar.high * 100) / 100,
        low: Math.round(bar.low * 100) / 100,
        close: Math.round(bar.close * 100) / 100,
        volume: bar.volume ?? undefined,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch (error) {
    console.error(`Error fetching ${range} price history for ${symbol}:`, error);
    return [];
  }
}

export interface PriceCagr {
  oneYear?: number;
  threeYear?: number;
  fiveYear?: number;
  tenYear?: number;
  lifetime?: number;
}

const CAGR_LOOKBACKS: { key: keyof PriceCagr; years: number }[] = [
  { key: "oneYear", years: 1 },
  { key: "threeYear", years: 3 },
  { key: "fiveYear", years: 5 },
  { key: "tenYear", years: 10 },
];

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

/**
 * Annualized price CAGR (%) for 1/3/5/10-year lookbacks plus lifetime
 * (since the earliest available bar), derived from a single MAX-range
 * (monthly) history fetch. A lookback is omitted rather than guessed when
 * the symbol's history doesn't reach back that far.
 */
export async function getPriceCagr(symbol: string, exchange?: string): Promise<PriceCagr> {
  try {
    const bars = await getPriceHistoryRange(symbol, "MAX", exchange);
    if (bars.length < 2) return {};

    const last = bars[bars.length - 1];
    const first = bars[0];
    const lastMs = new Date(last.date).getTime();
    const firstMs = new Date(first.date).getTime();
    const cagr: PriceCagr = {};

    for (const { key, years } of CAGR_LOOKBACKS) {
      const targetMs = lastMs - years * MS_PER_YEAR;
      if (firstMs > targetMs) continue; // history doesn't reach this far back

      let closest = bars[0];
      let closestDiff = Math.abs(new Date(closest.date).getTime() - targetMs);
      for (const bar of bars) {
        const diff = Math.abs(new Date(bar.date).getTime() - targetMs);
        if (diff < closestDiff) {
          closest = bar;
          closestDiff = diff;
        }
      }

      const actualYears = (lastMs - new Date(closest.date).getTime()) / MS_PER_YEAR;
      if (actualYears < 0.5 || closest.close <= 0) continue;

      cagr[key] = (Math.pow(last.close / closest.close, 1 / actualYears) - 1) * 100;
    }

    const lifetimeYears = (lastMs - firstMs) / MS_PER_YEAR;
    if (lifetimeYears >= 0.5 && first.close > 0) {
      cagr.lifetime = (Math.pow(last.close / first.close, 1 / lifetimeYears) - 1) * 100;
    }

    return cagr;
  } catch (error) {
    console.error(`Error computing price CAGR for ${symbol}:`, error);
    return {};
  }
}

/**
 * Fetch financial summary for a stock.
 *
 * Sector/industry/website/description live in the `summaryProfile`
 * quoteSummary module, not in `quote()` — the plain quote endpoint doesn't
 * carry them, so this previously always returned undefined for those fields.
 */
export async function getCompanyInfo(symbol: string, exchange?: string) {
  try {
    const ticker = getYahooTicker(symbol, exchange);

    const [quote, summary] = await Promise.all([
      withRetry(() => yahooFinance.quote(ticker, {}, withTimeout())),
      withRetry(() =>
        yahooFinance
          .quoteSummary(ticker, { modules: ["summaryProfile"] }, withTimeout())
          .catch(() => null)
      ),
    ]);

    return {
      name: quote.longName || quote.shortName,
      sector: summary?.summaryProfile?.sector,
      industry: summary?.summaryProfile?.industry,
      website: summary?.summaryProfile?.website,
      description: summary?.summaryProfile?.longBusinessSummary,
      marketCap: quote.marketCap,
      fiftyDayAverage: quote.fiftyDayAverage,
      twoHundredDayAverage: quote.twoHundredDayAverage,
    };
  } catch (error) {
    console.error(`Error fetching company info for ${symbol}:`, error);
    return null;
  }
}

export interface SearchResult {
  symbol: string;
  name: string;
  exchange?: string;
  type?: string;
}

/**
 * Returns true if the Yahoo Finance symbol is listed on NSE (.NS) or BSE (.BO).
 * Used to filter out non-Indian exchange results so we don't waste calls on them.
 */
function isNseOrBseSymbol(symbol?: string): boolean {
  if (!symbol) return false;
  const upper = symbol.toUpperCase();
  return upper.endsWith(".NS") || upper.endsWith(".BO");
}

/**
 * Search for stocks using Yahoo Finance API.
 * Restricted to NSE/BSE-listed symbols (.NS / .BO suffixes).
 */
export async function searchStocks(query: string): Promise<SearchResult[]> {
  try {
    const results = await withRetry(() => yahooFinance.search(query, {}, withTimeout()));

    if (!results || !results.quotes) {
      return [];
    }

    return results.quotes
      .filter((quote: any) => quote.symbol && quote.shortname && isNseOrBseSymbol(quote.symbol))
      .map((quote: any) => ({
        symbol: quote.symbol,
        name: quote.shortname || quote.longname || '',
        exchange: quote.exchDisp,
        type: quote.typeDisp,
      }))
      .slice(0, 10);
  } catch (error) {
    console.error(`Error searching for ${query}:`, error);
    return [];
  }
}

export interface FinancialStatement {
  date: string;
  revenue?: number;
  netIncome?: number;
  grossProfit?: number;
  operatingIncome?: number;
  totalAssets?: number;
  totalLiabilities?: number;
  stockholdersEquity?: number;
}

export interface IncomeStatementPeriod {
  date: string;
  periodType: "annual" | "quarterly";
  // Core metrics (already shown in UI)
  revenue?: number;
  grossProfit?: number;
  operatingIncome?: number;
  netIncome?: number;
  // Additional metrics available from Yahoo Finance
  costOfRevenue?: number;
  operatingExpense?: number;
  sellingGeneralAndAdministration?: number;
  ebitda?: number;
  ebit?: number;
  normalizedEbitda?: number;
  normalizedIncome?: number;
  interestIncome?: number;
  interestExpense?: number;
  netInterestIncome?: number;
  taxProvision?: number;
  pretaxIncome?: number;
  taxRateForCalcs?: number;
  dilutedEps?: number;
  basicEps?: number;
  dilutedAverageShares?: number;
  basicAverageShares?: number;
  totalUnusualItems?: number;
  totalExpenses?: number;
  netIncomeCommonStockholders?: number;
}

/**
 * Fetch income statement history (annual + quarterly) live from Yahoo Finance.
 *
 * Uses `fundamentalsTimeSeries` rather than the legacy `quoteSummary`
 * incomeStatementHistory* submodules — Yahoo has provided almost no data
 * through those submodules since Nov 2024.
 */
export async function getIncomeStatement(
  symbol: string,
  exchange?: string
): Promise<IncomeStatementPeriod[]> {
  try {
    const ticker = getYahooTicker(symbol, exchange);
    const [annual, quarterly] = await Promise.all([
      withRetry(() =>
        yahooFinance.fundamentalsTimeSeries(
          ticker,
          { period1: "2015-01-01", type: "annual", module: "financials" },
          withTimeout()
        )
      ),
      withRetry(() =>
        yahooFinance.fundamentalsTimeSeries(
          ticker,
          { period1: "2015-01-01", type: "quarterly", module: "financials" },
          withTimeout()
        )
      ),
    ]);

    const byDate = new Map<string, IncomeStatementPeriod>();
    // Annual first so it wins when a quarterly period lands on the same fiscal year-end date.
    const tagged = [
      ...(annual as any[]).map((el) => ({ el, periodType: "annual" as const })),
      ...(quarterly as any[]).map((el) => ({ el, periodType: "quarterly" as const })),
    ];
    for (const { el, periodType } of tagged) {
      if (!el.date) continue;
      const date = new Date(el.date).toISOString().split("T")[0];
      if (byDate.has(date)) continue;
      byDate.set(date, {
        date,
        periodType,
        revenue: el.totalRevenue ?? undefined,
        grossProfit: el.grossProfit ?? undefined,
        operatingIncome: el.operatingIncome ?? undefined,
        netIncome: el.netIncome ?? undefined,
        costOfRevenue: el.costOfRevenue ?? undefined,
        operatingExpense: el.operatingExpense ?? undefined,
        sellingGeneralAndAdministration: el.sellingGeneralAndAdministration ?? undefined,
        ebitda: el.EBITDA ?? undefined,
        ebit: el.EBIT ?? undefined,
        normalizedEbitda: el.normalizedEBITDA ?? undefined,
        normalizedIncome: el.normalizedIncome ?? undefined,
        interestIncome: el.interestIncome ?? undefined,
        interestExpense: el.interestExpense ?? undefined,
        netInterestIncome: el.netInterestIncome ?? undefined,
        taxProvision: el.taxProvision ?? undefined,
        pretaxIncome: el.pretaxIncome ?? undefined,
        taxRateForCalcs: el.taxRateForCalcs ?? undefined,
        dilutedEps: el.dilutedEPS ?? undefined,
        basicEps: el.basicEPS ?? undefined,
        dilutedAverageShares: el.dilutedAverageShares ?? undefined,
        basicAverageShares: el.basicAverageShares ?? undefined,
        totalUnusualItems: el.totalUnusualItems ?? undefined,
        totalExpenses: el.totalExpenses ?? undefined,
        netIncomeCommonStockholders: el.netIncomeCommonStockholders ?? undefined,
      });
    }

    return [...byDate.values()].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  } catch (error) {
    console.error(`Error fetching income statement for ${symbol}:`, error);
    return [];
  }
}

export interface BalanceSheetPeriod {
  date: string;
  periodType: "annual" | "quarterly";
  // Core metrics (already shown in UI)
  totalAssets?: number;
  totalLiabilities?: number;
  stockholdersEquity?: number;
  // Additional metrics available from Yahoo Finance
  currentAssets?: number;
  cashAndCashEquivalents?: number;
  inventory?: number;
  accountsReceivable?: number;
  netPPE?: number;
  totalNonCurrentAssets?: number;
  currentLiabilities?: number;
  accountsPayable?: number;
  longTermDebt?: number;
  totalDebt?: number;
  totalNonCurrentLiabilities?: number;
  retainedEarnings?: number;
  commonStockEquity?: number;
  workingCapital?: number;
  netDebt?: number;
  tangibleBookValue?: number;
  investedCapital?: number;
  totalCapitalization?: number;
  minorityInterest?: number;
}

/**
 * Fetch balance sheet history (annual + quarterly) live from Yahoo Finance.
 *
 * Uses `fundamentalsTimeSeries` rather than the legacy `quoteSummary`
 * balanceSheetHistory* submodules — Yahoo has provided almost no data
 * through those submodules since Nov 2024.
 */
export async function getBalanceSheet(
  symbol: string,
  exchange?: string
): Promise<BalanceSheetPeriod[]> {
  try {
    const ticker = getYahooTicker(symbol, exchange);
    const [annual, quarterly] = await Promise.all([
      withRetry(() =>
        yahooFinance.fundamentalsTimeSeries(
          ticker,
          { period1: "2015-01-01", type: "annual", module: "balance-sheet" },
          withTimeout()
        )
      ),
      withRetry(() =>
        yahooFinance.fundamentalsTimeSeries(
          ticker,
          { period1: "2015-01-01", type: "quarterly", module: "balance-sheet" },
          withTimeout()
        )
      ),
    ]);

    const byDate = new Map<string, BalanceSheetPeriod>();
    // Annual first so it wins when a quarterly period lands on the same fiscal year-end date.
    const tagged = [
      ...(annual as any[]).map((stmt) => ({ stmt, periodType: "annual" as const })),
      ...(quarterly as any[]).map((stmt) => ({ stmt, periodType: "quarterly" as const })),
    ];
    for (const { stmt, periodType } of tagged) {
      if (!stmt.date) continue;
      const date = new Date(stmt.date).toISOString().split("T")[0];
      if (byDate.has(date)) continue;
      byDate.set(date, {
        date,
        periodType,
        totalAssets: stmt.totalAssets ?? undefined,
        totalLiabilities: stmt.totalLiabilitiesNetMinorityInterest ?? undefined,
        stockholdersEquity: stmt.stockholdersEquity ?? undefined,
        currentAssets: stmt.currentAssets ?? undefined,
        cashAndCashEquivalents: stmt.cashAndCashEquivalents ?? undefined,
        inventory: stmt.inventory ?? undefined,
        accountsReceivable: stmt.accountsReceivable ?? undefined,
        netPPE: stmt.netPPE ?? undefined,
        totalNonCurrentAssets: stmt.totalNonCurrentAssets ?? undefined,
        currentLiabilities: stmt.currentLiabilities ?? undefined,
        accountsPayable: stmt.accountsPayable ?? undefined,
        longTermDebt: stmt.longTermDebt ?? undefined,
        totalDebt: stmt.totalDebt ?? undefined,
        totalNonCurrentLiabilities: stmt.totalNonCurrentLiabilitiesNetMinorityInterest ?? undefined,
        retainedEarnings: stmt.retainedEarnings ?? undefined,
        commonStockEquity: stmt.commonStockEquity ?? undefined,
        workingCapital: stmt.workingCapital ?? undefined,
        netDebt: stmt.netDebt ?? undefined,
        tangibleBookValue: stmt.tangibleBookValue ?? undefined,
        investedCapital: stmt.investedCapital ?? undefined,
        totalCapitalization: stmt.totalCapitalization ?? undefined,
        minorityInterest: stmt.minorityInterest ?? undefined,
      });
    }

    return [...byDate.values()].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  } catch (error) {
    console.error(`Error fetching balance sheet for ${symbol}:`, error);
    return [];
  }
}

export interface CashFlowPeriod {
  date: string;
  periodType: "annual" | "quarterly";
  operatingCashFlow?: number;
  investingCashFlow?: number;
  financingCashFlow?: number;
  freeCashFlow?: number;
  capitalExpenditure?: number;
  endCashPosition?: number;
  beginningCashPosition?: number;
  changesInCash?: number;
  repurchaseOfCapitalStock?: number;
  issuanceOfCapitalStock?: number;
  cashDividendsPaid?: number;
  repaymentOfDebt?: number;
  issuanceOfDebt?: number;
  depreciationAndAmortization?: number;
  stockBasedCompensation?: number;
  changeInWorkingCapital?: number;
  interestPaidSupplementalData?: number;
  incomeTaxPaidSupplementalData?: number;
}

/**
 * Fetch cash flow statement history (annual + quarterly) live from Yahoo Finance.
 *
 * Uses `fundamentalsTimeSeries` rather than the legacy `quoteSummary`
 * cashflowStatementHistory* submodules — Yahoo has provided almost no data
 * through those submodules since Nov 2024.
 */
export async function getCashFlow(
  symbol: string,
  exchange?: string
): Promise<CashFlowPeriod[]> {
  try {
    const ticker = getYahooTicker(symbol, exchange);
    const [annual, quarterly] = await Promise.all([
      withRetry(() =>
        yahooFinance.fundamentalsTimeSeries(
          ticker,
          { period1: "2015-01-01", type: "annual", module: "cash-flow" },
          withTimeout()
        )
      ),
      withRetry(() =>
        yahooFinance.fundamentalsTimeSeries(
          ticker,
          { period1: "2015-01-01", type: "quarterly", module: "cash-flow" },
          withTimeout()
        )
      ),
    ]);

    const byDate = new Map<string, CashFlowPeriod>();
    // Annual first so it wins when a quarterly period lands on the same fiscal year-end date.
    const tagged = [
      ...(annual as any[]).map((stmt) => ({ stmt, periodType: "annual" as const })),
      ...(quarterly as any[]).map((stmt) => ({ stmt, periodType: "quarterly" as const })),
    ];
    for (const { stmt, periodType } of tagged) {
      if (!stmt.date) continue;
      const date = new Date(stmt.date).toISOString().split("T")[0];
      if (byDate.has(date)) continue;
      byDate.set(date, {
        date,
        periodType,
        operatingCashFlow: stmt.operatingCashFlow ?? undefined,
        investingCashFlow: stmt.investingCashFlow ?? undefined,
        financingCashFlow: stmt.financingCashFlow ?? undefined,
        freeCashFlow: stmt.freeCashFlow ?? undefined,
        capitalExpenditure: stmt.capitalExpenditure ?? undefined,
        endCashPosition: stmt.endCashPosition ?? undefined,
        beginningCashPosition: stmt.beginningCashPosition ?? undefined,
        changesInCash: stmt.changesInCash ?? undefined,
        repurchaseOfCapitalStock: stmt.repurchaseOfCapitalStock ?? undefined,
        issuanceOfCapitalStock: stmt.issuanceOfCapitalStock ?? undefined,
        cashDividendsPaid: stmt.cashDividendsPaid ?? undefined,
        repaymentOfDebt: stmt.repaymentOfDebt ?? undefined,
        issuanceOfDebt: stmt.issuanceOfDebt ?? undefined,
        depreciationAndAmortization: stmt.depreciationAndAmortization ?? undefined,
        stockBasedCompensation: stmt.stockBasedCompensation ?? undefined,
        changeInWorkingCapital: stmt.changeInWorkingCapital ?? undefined,
        interestPaidSupplementalData: stmt.interestPaidSupplementalData ?? undefined,
        incomeTaxPaidSupplementalData: stmt.incomeTaxPaidSupplementalData ?? undefined,
      });
    }

    return [...byDate.values()].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  } catch (error) {
    console.error(`Error fetching cash flow for ${symbol}:`, error);
    return [];
  }
}

export interface CompanyNewsArticle {
  title: string;
  link: string;
  source: string;
  publishedAt: string;
  summary?: string;
}

/**
 * Fetch recent news articles for a stock live from Yahoo Finance.
 *
 * Yahoo's search-news endpoint has degraded to mostly returning generic
 * trending stories regardless of query (verified empirically — even
 * large-cap NSE tickers return zero query-relevant results), so results
 * are filtered down to articles Yahoo explicitly tags with this ticker via
 * `relatedTickers`. This means the array is frequently empty; callers
 * should treat that the same as "no news available" rather than an error.
 */
export async function getCompanyNews(
  symbol: string,
  exchange?: string,
  limit: number = 15
): Promise<CompanyNewsArticle[]> {
  try {
    const ticker = getYahooTicker(symbol, exchange);
    const results = await withRetry(() =>
      yahooFinance.search(ticker, { newsCount: limit, quotesCount: 1 }, withTimeout())
    );

    if (!results?.news) {
      return [];
    }

    return results.news
      .filter(
        (article: any) =>
          article.title && article.link && article.relatedTickers?.includes(ticker)
      )
      .slice(0, limit)
      .map((article: any) => ({
        title: article.title,
        link: article.link,
        source: article.publisher || "Yahoo Finance",
        publishedAt: new Date(article.providerPublishTime).toISOString(),
      }));
  } catch (error) {
    console.error(`Error fetching news for ${symbol}:`, error);
    return [];
  }
}


export interface StockRatios {
  // Valuation & leverage
  peRatio?: number;
  priceToBook?: number;
  pegRatio?: number;
  beta?: number;
  debtToEquity?: number;
  roe?: number;
  roa?: number;
  currentRatio?: number;
  quickRatio?: number;
  profitMargin?: number;
  operatingMargin?: number;
  // Analyst estimates
  targetHighPrice?: number;
  targetLowPrice?: number;
  targetMeanPrice?: number;
  recommendationKey?: string;
  recommendationMean?: number;
  numberOfAnalystOpinions?: number;
  // Dividends
  dividendRate?: number;
  dividendYield?: number;
  payoutRatio?: number;
  exDividendDate?: string;
  // Growth
  earningsGrowth?: number;
  revenueGrowth?: number;
  // Cash flow & balance sheet
  freeCashflow?: number;
  operatingCashflow?: number;
  totalCash?: number;
  totalDebt?: number;
}

/**
 * Fetch financial ratios, analyst estimates, dividend and growth/cash-flow
 * data for a stock in a single call.
 *
 * These all live in the `financialData` / `defaultKeyStatistics` /
 * `summaryDetail` quoteSummary modules — the plain `quote()` endpoint used
 * previously doesn't carry them, so most fields here (everything but P/E
 * and price-to-book) used to always come back undefined.
 */
export async function getFinancialRatios(
  symbol: string,
  exchange?: string
): Promise<StockRatios> {
  try {
    const ticker = getYahooTicker(symbol, exchange);
    const summary = await withRetry(() =>
      yahooFinance.quoteSummary(
        ticker,
        { modules: ["financialData", "defaultKeyStatistics", "summaryDetail"] },
        withTimeout()
      )
    );
    const fd = summary.financialData;
    const ks = summary.defaultKeyStatistics;
    const sd = summary.summaryDetail;

    return {
      peRatio: sd?.trailingPE,
      priceToBook: ks?.priceToBook,
      pegRatio: ks?.pegRatio,
      beta: ks?.beta,
      debtToEquity: fd?.debtToEquity,
      roe: fd?.returnOnEquity,
      roa: fd?.returnOnAssets,
      currentRatio: fd?.currentRatio,
      quickRatio: fd?.quickRatio,
      profitMargin: fd?.profitMargins,
      operatingMargin: fd?.operatingMargins,
      targetHighPrice: fd?.targetHighPrice,
      targetLowPrice: fd?.targetLowPrice,
      targetMeanPrice: fd?.targetMeanPrice,
      recommendationKey: fd?.recommendationKey,
      recommendationMean: fd?.recommendationMean,
      numberOfAnalystOpinions: fd?.numberOfAnalystOpinions,
      dividendRate: sd?.dividendRate,
      dividendYield: sd?.dividendYield,
      payoutRatio: sd?.payoutRatio,
      exDividendDate: sd?.exDividendDate
        ? new Date(sd.exDividendDate).toISOString().split("T")[0]
        : undefined,
      earningsGrowth: fd?.earningsGrowth,
      revenueGrowth: fd?.revenueGrowth,
      freeCashflow: fd?.freeCashflow,
      operatingCashflow: fd?.operatingCashflow,
      totalCash: fd?.totalCash,
      totalDebt: fd?.totalDebt,
    };
  } catch (error) {
    console.error(`Error fetching ratios for ${symbol}:`, error);
    return {};
  }
}

export interface NewsArticle {
  title: string;
  link: string;
  source: string;
  publishedAt: string;
  summary?: string;
}


export interface PeerMetrics {
  symbol: string;
  name: string;
  isCurrent?: boolean;
  // Price & size
  price?: number;
  changePercent?: number;
  marketCap?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  // Valuation
  peRatio?: number;
  forwardPE?: number;
  priceToBook?: number;
  pegRatio?: number;
  priceToSales?: number;
  enterpriseValue?: number;
  evToEbitda?: number;
  evToRevenue?: number;
  beta?: number;
  // Profitability
  roe?: number;
  roa?: number;
  netMargin?: number;
  grossMargin?: number;
  operatingMargin?: number;
  ebitdaMargin?: number;
  // P&L essentials (already in the same quoteSummary call, no extra fetch)
  revenue?: number;
  grossProfit?: number;
  ebitda?: number;
  netIncome?: number;
  trailingEps?: number;
  forwardEps?: number;
  // Balance sheet essentials
  totalCash?: number;
  totalDebt?: number;
  debtToEquity?: number;
  currentRatio?: number;
  quickRatio?: number;
  // Cash flow essentials
  operatingCashFlow?: number;
  freeCashFlow?: number;
  // Growth
  revenueGrowth?: number;
  earningsGrowth?: number;
  earningsQuarterlyGrowth?: number;
  salesVarQoQ?: number;
  profitVarQoQ?: number;
  // Dividends
  dividendYield?: number;
  payoutRatio?: number;
}

export interface PeerComparison {
  sector?: string;
  industry?: string;
  companies: PeerMetrics[];
}

type PeerFetchResult = PeerMetrics & { industry?: string; sector?: string };

// Yahoo's `financialData` module (and a few `defaultKeyStatistics` fields like
// netIncomeToCommon) report absolute financial-statement figures — revenue,
// cash, debt, EBITDA, net income — in the company's *reporting* currency, not
// its trading currency. For dual-listed companies like Infosys (reports in
// USD via its ADR, trades in INR on the NSE) this silently produces numbers
// ~80x too small if treated as rupees. Per-share/ratio fields (EPS, book
// value, P/B, enterprise value) are unaffected — Yahoo already normalizes
// those to the trading currency. Verified empirically: INFY.NS's
// financialData.financialCurrency is "USD" while its bookValue/trailingEps
// are already in INR.
// Same in-flight-promise coalescing as the crumb/peer-metrics caches above —
// several peers reporting in the same foreign currency resolving at once
// would otherwise each independently fetch the same FX rate.
const fxRateCache = new Map<string, { promise: Promise<number | null>; expiresAt: number }>();
const FX_TTL_MS = 60 * 60 * 1000;
const FX_FAILURE_TTL_MS = 60 * 1000;

async function getFxRateToInr(currency?: string | null): Promise<number | null> {
  if (!currency || currency === "INR") return 1;
  const cached = fxRateCache.get(currency);
  if (cached && cached.expiresAt > Date.now()) return cached.promise;

  const promise = fetchFxRateToInrSafe(currency);
  const entry = { promise, expiresAt: Date.now() + FX_TTL_MS };
  fxRateCache.set(currency, entry);
  const rate = await promise;
  if (rate == null && fxRateCache.get(currency) === entry) {
    entry.expiresAt = Date.now() + FX_FAILURE_TTL_MS;
  }
  return rate;
}

async function fetchFxRateToInrSafe(currency: string): Promise<number | null> {
  try {
    const fxQuote = await withRetry(() => yahooFinance.quote(`${currency}INR=X`, {}, withTimeout()));
    return fxQuote?.regularMarketPrice ?? null;
  } catch {
    return null;
  }
}

interface QuarterlyGrowth {
  salesVarQoQ: number | null;
  profitVarQoQ: number | null;
}

/**
 * Quarter-over-quarter revenue/net-income growth — the latest reported
 * quarter vs. the immediately prior one. Deliberately a separate, narrow
 * call rather than reusing `getIncomeStatement` (which fetches full
 * annual+quarterly history back to 2015 for the Financials tab) — only the
 * 2 most recent quarterly periods are needed here, and this runs once per
 * peer/company across potentially dozens of candidates (Industry tool), so
 * keeping the payload small matters. Never throws — a fetch failure or thin
 * history (<2 quarters) just yields nulls, same tolerance as the rest of
 * `fetchPeerMetrics`.
 */
async function getQuarterlyGrowth(ticker: string): Promise<QuarterlyGrowth> {
  try {
    const period1 = new Date();
    period1.setMonth(period1.getMonth() - 9);
    const quarterly = await withRetry(() =>
      yahooFinance.fundamentalsTimeSeries(
        ticker,
        { period1: period1.toISOString().split("T")[0], type: "quarterly", module: "financials" },
        withTimeout()
      )
    );

    const periods = (quarterly as any[])
      .filter((el) => el?.date)
      .map((el) => ({
        time: new Date(el.date).getTime(),
        revenue: el.totalRevenue as number | undefined,
        netIncome: el.netIncome as number | undefined,
      }))
      .sort((a, b) => a.time - b.time);

    if (periods.length < 2) return { salesVarQoQ: null, profitVarQoQ: null };
    const [prior, latest] = periods.slice(-2);

    const qoq = (curr?: number, prev?: number): number | null =>
      curr == null || prev == null || prev === 0 ? null : (curr - prev) / Math.abs(prev);

    return { salesVarQoQ: qoq(latest.revenue, prior.revenue), profitVarQoQ: qoq(latest.netIncome, prior.netIncome) };
  } catch {
    return { salesVarQoQ: null, profitVarQoQ: null };
  }
}

// Peer-metrics results are identical for every caller within a short window
// (Industry pagination re-requests the same tickers on Prev/Back, multiple
// users browsing the same popular sector, etc.) — an in-memory TTL cache
// avoids re-issuing the 3 Yahoo calls per ticker on every hit. Same pattern
// as `crumbCache`/`fxRateCache` below. Failed fetches get a short TTL so a
// transient Yahoo hiccup doesn't get "stuck" for the full cache window.
const PEER_METRICS_CACHE_TTL_MS = 5 * 60 * 1000;
const PEER_METRICS_FAILURE_TTL_MS = 30 * 1000;
// Stores the in-flight promise, not the resolved value, so concurrent
// requests for the same uncached ticker (Industry + Compare both loading the
// same popular stock at once, several users opening the same trending
// company) share one fetch instead of each independently firing their own —
// otherwise every one of those 3 Yahoo calls per ticker multiplies by however
// many requests land in that window.
const peerMetricsCache = new Map<string, { promise: Promise<PeerFetchResult | null>; expiresAt: number }>();

export async function fetchPeerMetrics(ticker: string): Promise<PeerFetchResult | null> {
  const cached = peerMetricsCache.get(ticker);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.promise;
  }

  const promise = fetchPeerMetricsUncached(ticker);
  const entry = { promise, expiresAt: Date.now() + PEER_METRICS_CACHE_TTL_MS };
  peerMetricsCache.set(ticker, entry);
  // fetchPeerMetricsUncached never rejects (it catches internally), so this
  // just corrects the optimistic success TTL down to the shorter failure
  // TTL once we know the fetch actually came back empty.
  promise.then((data) => {
    if (data == null && peerMetricsCache.get(ticker) === entry) {
      entry.expiresAt = Date.now() + PEER_METRICS_FAILURE_TTL_MS;
    }
  });
  return promise;
}

async function fetchPeerMetricsUncached(ticker: string): Promise<PeerFetchResult | null> {
  try {
    const [quote, summary, growth] = await Promise.all([
      withRetry(() => yahooFinance.quote(ticker, {}, withTimeout())),
      withRetry(() =>
        yahooFinance
          .quoteSummary(
            ticker,
            { modules: ["summaryProfile", "financialData", "defaultKeyStatistics", "summaryDetail"] },
            withTimeout()
          )
          .catch(() => null)
      ),
      getQuarterlyGrowth(ticker),
    ]);

    if (!quote || quote.regularMarketPrice == null) {
      return null;
    }

    const fd = summary?.financialData;
    const ks = summary?.defaultKeyStatistics;
    const sd = summary?.summaryDetail;
    const sp = summary?.summaryProfile;

    // Only fetches (and only on a cache miss) when a peer actually reports in
    // a non-INR currency — the common case (financialCurrency === "INR" or
    // absent) short-circuits to a rate of 1 with no network call.
    const fxRate = await getFxRateToInr(fd?.financialCurrency);
    const toInr = (v?: number): number | undefined => (v == null || fxRate == null ? undefined : v * fxRate);

    return {
      symbol: ticker.replace(/\.(NS|BO)$/i, ""),
      name: quote.longName || quote.shortName || ticker,
      price: quote.regularMarketPrice,
      changePercent: quote.regularMarketChangePercent,
      marketCap: quote.marketCap,
      fiftyTwoWeekHigh: sd?.fiftyTwoWeekHigh,
      fiftyTwoWeekLow: sd?.fiftyTwoWeekLow,
      peRatio: sd?.trailingPE,
      forwardPE: sd?.forwardPE ?? ks?.forwardPE,
      priceToBook: ks?.priceToBook,
      pegRatio: ks?.pegRatio,
      priceToSales: sd?.priceToSalesTrailing12Months,
      enterpriseValue: ks?.enterpriseValue,
      evToEbitda: ks?.enterpriseToEbitda,
      evToRevenue: ks?.enterpriseToRevenue,
      beta: sd?.beta ?? ks?.beta,
      roe: fd?.returnOnEquity,
      roa: fd?.returnOnAssets,
      netMargin: fd?.profitMargins,
      grossMargin: fd?.grossMargins,
      operatingMargin: fd?.operatingMargins,
      ebitdaMargin: fd?.ebitdaMargins,
      revenue: toInr(fd?.totalRevenue),
      grossProfit: toInr(fd?.grossProfits),
      ebitda: toInr(fd?.ebitda),
      netIncome: toInr(ks?.netIncomeToCommon),
      trailingEps: ks?.trailingEps,
      forwardEps: ks?.forwardEps,
      totalCash: toInr(fd?.totalCash),
      totalDebt: toInr(fd?.totalDebt),
      debtToEquity: fd?.debtToEquity,
      currentRatio: fd?.currentRatio,
      quickRatio: fd?.quickRatio,
      operatingCashFlow: toInr(fd?.operatingCashflow),
      freeCashFlow: toInr(fd?.freeCashflow),
      revenueGrowth: fd?.revenueGrowth,
      earningsGrowth: fd?.earningsGrowth,
      earningsQuarterlyGrowth: ks?.earningsQuarterlyGrowth,
      salesVarQoQ: growth.salesVarQoQ ?? undefined,
      profitVarQoQ: growth.profitVarQoQ ?? undefined,
      dividendYield: sd?.dividendYield,
      payoutRatio: sd?.payoutRatio,
      sector: sp?.sector,
      industry: sp?.industry,
    };
  } catch {
    return null;
  }
}

/** Runs `fn` over `items` with at most `limit` requests in flight at a time. */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += limit) {
    const batch = items.slice(i, i + limit);
    results.push(...(await Promise.all(batch.map(fn))));
  }
  return results;
}

export function stripInternal(m: PeerFetchResult): PeerMetrics {
  const { industry: _industry, sector: _sector, ...rest } = m;
  return rest;
}

/**
 * Fetches full peer-style metrics for an arbitrary set of already-resolved
 * Yahoo tickers — the building block for the user-driven "Compare" feature
 * (as opposed to `getPeerComparison`'s single-symbol auto-discovery flow).
 * Exchange resolution (symbol -> ticker) is the caller's responsibility via
 * `getYahooTicker`, since that needs a Prisma lookup this module doesn't do.
 */
export async function getMultiCompanyMetrics(tickers: string[]): Promise<(PeerMetrics | null)[]> {
  const results = await mapWithConcurrency(tickers, 5, fetchPeerMetrics);
  return results.map((r) => (r ? stripInternal(r) : null));
}

// --- Yahoo custom equity screener (region + sector), reverse-engineered from ---
// --- Python yfinance's EquityQuery/screen(), which POSTs this exact shape.   ---
// yahoo-finance2 (the npm client) only exposes Yahoo's *predefined* screens
// (day_gainers, most_actives, etc) via GET — arbitrary field queries like
// "region=in AND sector=X" require a POST to a different endpoint with a
// crumb, which the npm client's module system never issues (it's GET-only
// internally). This talks to that endpoint directly.
const YAHOO_SCREENER_URL = "https://query1.finance.yahoo.com/v1/finance/screener";
const YAHOO_CRUMB_URL = "https://query1.finance.yahoo.com/v1/test/getcrumb";
const CRUMB_TTL_MS = 20 * 60 * 1000;

// Stores the in-flight *promise*, not the resolved value — if several
// requests land while the crumb is being (re-)fetched, they all await the
// same promise instead of each independently starting their own 2-hop
// handshake (cache stampede). Failures clear themselves out (see below)
// rather than being remembered for the full TTL.
let crumbCache: { promise: Promise<{ crumb: string; cookie: string }>; expiresAt: number } | null = null;

async function getYahooCrumb(): Promise<{ crumb: string; cookie: string }> {
  if (crumbCache && crumbCache.expiresAt > Date.now()) {
    return crumbCache.promise;
  }
  const promise = withRetry(() => fetchYahooCrumbUncached());
  const entry = { promise, expiresAt: Date.now() + CRUMB_TTL_MS };
  crumbCache = entry;
  promise.catch(() => {
    if (crumbCache === entry) crumbCache = null;
  });
  return promise;
}

async function fetchYahooCrumbUncached(): Promise<{ crumb: string; cookie: string }> {
  const consentRes = await fetch("https://fc.yahoo.com", {
    redirect: "manual",
    signal: AbortSignal.timeout(YAHOO_TIMEOUT_MS),
  });
  const setCookies = consentRes.headers.getSetCookie?.() ?? [];
  const cookie = setCookies.map((c) => c.split(";")[0]).join("; ");

  const crumbRes = await fetch(YAHOO_CRUMB_URL, {
    headers: { cookie, "User-Agent": "Mozilla/5.0" },
    signal: AbortSignal.timeout(YAHOO_TIMEOUT_MS),
  });
  if (!crumbRes.ok) {
    throw new Error(`getcrumb failed: ${crumbRes.status}`);
  }
  const crumb = await crumbRes.text();
  return { crumb, cookie };
}

// Sector screener pages rarely change within a browsing session — caching
// each (sector, offset, size) page for the same window as the crumb avoids
// a full authenticated POST on every Prev/Next click or repeat sector visit.
// Same in-flight-promise coalescing as the crumb cache above, for the same
// reason (concurrent Industry-page requests for a popular sector).
const SECTOR_SCREEN_CACHE_TTL_MS = CRUMB_TTL_MS;
const sectorScreenCache = new Map<string, { promise: Promise<string[]>; expiresAt: number }>();

/**
 * Screens NSE/BSE-listed equities by exact sector match — or the whole
 * region when `sector` is omitted — sorted by market cap descending.
 * Mirrors `EquityQuery('and', [eq(region,'in'), eq(sector,X)])` from the
 * Python library (dropping the sector operand entirely when unset).
 * Returns raw Yahoo tickers (e.g. "DLF.NS").
 */
export async function screenEquities(options: { sector?: string; size?: number; offset?: number } = {}): Promise<string[]> {
  const { sector, size = 90, offset = 0 } = options;
  const cacheKey = `${sector ?? "*"}:${offset}:${size}`;
  const cached = sectorScreenCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.promise;
  }

  const promise = withRetry(() => screenEquitiesUncached(sector, size, offset));
  sectorScreenCache.set(cacheKey, { promise, expiresAt: Date.now() + SECTOR_SCREEN_CACHE_TTL_MS });
  promise.catch(() => {
    const entry = sectorScreenCache.get(cacheKey);
    if (entry?.promise === promise) sectorScreenCache.delete(cacheKey);
  });
  return promise;
}

/** Thin single-sector wrapper for the existing Industry/Peers callers. */
export async function screenBySector(sector: string, size = 90, offset = 0): Promise<string[]> {
  return screenEquities({ sector, size, offset });
}

async function screenEquitiesUncached(sector: string | undefined, size: number, offset: number): Promise<string[]> {
  const { crumb, cookie } = await getYahooCrumb();

  const operands: unknown[] = [{ operator: "EQ", operands: ["region", "in"] }];
  if (sector) operands.push({ operator: "EQ", operands: ["sector", sector] });

  const body = {
    offset,
    size,
    sortField: "intradaymarketcap",
    sortType: "DESC",
    userId: "",
    userIdType: "guid",
    quoteType: "EQUITY",
    query: { operator: "AND", operands },
  };

  const url = `${YAHOO_SCREENER_URL}?corsDomain=finance.yahoo.com&formatted=false&lang=en-US&region=US&crumb=${encodeURIComponent(crumb)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie, "User-Agent": "Mozilla/5.0" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(YAHOO_TIMEOUT_MS),
  });

  if (!res.ok) {
    // A stale crumb/cookie pair is the most likely cause of a 4xx here;
    // drop the cache so the retry (and any call after it) re-authenticates
    // instead of looping on the same bad credentials.
    crumbCache = null;
    throw new Error(`screener failed: ${res.status}`);
  }

  const json = await res.json();
  const quotes = json?.finance?.result?.[0]?.quotes ?? [];
  return quotes.map((q: any) => q.symbol as string | undefined).filter((s: unknown): s is string => !!s);
}

/**
 * Discovers peer companies in the same industry and compares them on
 * valuation/profitability/leverage metrics.
 *
 * Primary discovery is a direct sector+region screen (see `screenBySector`)
 * — the same broad net Python's `yf.screen(EquityQuery(...))` casts, just
 * called directly since yahoo-finance2 doesn't expose it. A free-text
 * `search(industry)` (e.g. "Information Technology Services") was tried
 * first and verified empirically useless — it returns nothing for
 * TCS/INFY/RELIANCE. Yahoo's "similar companies" graph
 * (`recommendationsBySymbol`) was tried second and works for some sectors
 * (banks, IT) but misses others entirely (0 results for Real Estate, Steel)
 * since it's correlation-based, not classification-based — it's kept here
 * only as a fallback if the screen call itself fails (crumb/cookie hiccup).
 * Either way, each candidate's exact industry string is verified via its
 * own profile before being accepted — discovery is just the funnel, the
 * industry match is the actual filter.
 */
export async function getPeerComparison(
  symbol: string,
  exchange?: string,
  maxPeers = 10
): Promise<PeerComparison> {
  try {
    const ticker = getYahooTicker(symbol, exchange);
    const target = await fetchPeerMetrics(ticker);

    if (!target) {
      return { companies: [] };
    }
    if (!target.industry) {
      return { sector: target.sector, companies: [stripInternal({ ...target, isCurrent: true })] };
    }

    const { industry, sector } = target;

    // NSE-only, same as the Python script's explicit rule — Yahoo lists most
    // Indian companies on both NSE (.NS) and BSE (.BO), and admitting both
    // would show the same company twice under slightly different quote data.
    const isNseSymbol = (s?: string) => !!s && s.toUpperCase().endsWith(".NS");
    const targetBase = target.symbol.toUpperCase();
    const notTarget = (s: string) => s.toUpperCase().replace(/\.(NS|BO)$/i, "") !== targetBase;

    let candidateSymbols: string[] = [];
    try {
      const screened = sector ? await screenBySector(sector, Math.max(maxPeers * 6, 60)) : [];
      candidateSymbols = screened.filter((s) => isNseSymbol(s) && notTarget(s));
    } catch (error) {
      console.error(`Sector screen failed for ${symbol}, falling back to recommendation graph:`, error);
    }

    if (candidateSymbols.length === 0) {
      const hop1 = await yahooFinance
        .recommendationsBySymbol(ticker, {}, withTimeout())
        .catch(() => null);
      const hop1Symbols = (hop1?.recommendedSymbols ?? []).map((r) => r.symbol);

      const hop2Lists = await mapWithConcurrency(hop1Symbols.slice(0, 5), 5, (s) =>
        yahooFinance.recommendationsBySymbol(s, {}, withTimeout()).catch(() => null)
      );
      const hop2Symbols = hop2Lists.flatMap((r) => r?.recommendedSymbols?.map((rec) => rec.symbol) ?? []);

      candidateSymbols = Array.from(new Set([...hop1Symbols, ...hop2Symbols])).filter(
        (s) => isNseSymbol(s) && notTarget(s)
      );
    }

    // Bound worst-case API calls — candidates are already market-cap sorted
    // when they came from the sector screen, so this keeps the largest names.
    candidateSymbols = candidateSymbols.slice(0, 40);

    const candidateMetrics = await mapWithConcurrency(candidateSymbols, 5, fetchPeerMetrics);

    const seen = new Set<string>();
    const peers = candidateMetrics
      .filter(
        (m): m is PeerFetchResult =>
          m != null && m.industry === industry && !!m.marketCap && m.marketCap > 0
      )
      .sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0))
      .filter((m) => {
        const key = m.symbol.toUpperCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, maxPeers)
      .map(stripInternal);

    return {
      sector,
      industry,
      companies: [stripInternal({ ...target, isCurrent: true }), ...peers],
    };
  } catch (error) {
    console.error(`Error fetching peer comparison for ${symbol}:`, error);
    return { companies: [] };
  }
}

export interface SectorScreenResult {
  sector: string;
  companies: PeerMetrics[];
  page: number;
  /** True if this page came back full, so a next page is worth requesting. */
  hasMore: boolean;
}

function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(ltd|limited|inc|incorporated|corp|corporation|plc|co)\b\.?/g, "")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Screens NSE+BSE-listed equities in a given Yahoo sector and fetches full
 * peer-style metrics for one page of them, ordered by market cap descending.
 *
 * Unlike `getPeerComparison` (single-symbol peer discovery, NSE-only by
 * design to avoid double-counting a target's own dual listing), this keeps
 * both `.NS` and `.BO` results since the whole point is exhaustive sector
 * coverage. Dual-listed companies are deduped in two passes, each scoped to
 * the current page only (no cross-page state): first cheaply by ticker root
 * (handles the common ABC.NS/ABC.BO case), then — after fetching full
 * metrics — by normalized company name, since some BSE listings use a
 * numeric scrip code ticker (e.g. "500325.BO") that shares no ticker root
 * with its NSE counterpart and would otherwise slip past pass 1. Because
 * dedup is page-local, a page can come back with fewer than `pageSize` rows
 * when it happens to contain several dual-listings — accepted trade-off for
 * keeping pagination stateless (each page is one clean offset-based screen).
 */
/**
 * Shared by `getCompaniesBySector` and `getScreenUniverse`: dedupes raw
 * screener tickers (first cheaply by ticker root, then — after fetching
 * full metrics — by normalized company name, since some BSE listings use a
 * numeric scrip-code ticker that shares no root with its NSE counterpart),
 * fetches full peer-style metrics, and sorts by market cap descending.
 */
async function resolveScreenedMetrics(tickers: string[]): Promise<PeerMetrics[]> {
  const rootSeen = new Set<string>();
  const byRootDeduped: string[] = [];
  for (const ticker of tickers) {
    const root = ticker.toUpperCase().replace(/\.(NS|BO)$/i, "");
    if (rootSeen.has(root)) continue;
    rootSeen.add(root);
    byRootDeduped.push(ticker);
  }

  const candidateMetrics = await mapWithConcurrency(byRootDeduped, 5, (ticker) =>
    fetchPeerMetrics(ticker).then((m) => (m ? { ticker, metrics: m } : null))
  );

  const nameSeen = new Set<string>();
  return candidateMetrics
    .filter((c): c is { ticker: string; metrics: PeerFetchResult } => c != null && !!c.metrics.marketCap && c.metrics.marketCap > 0)
    .sort((a, b) => (b.metrics.marketCap ?? 0) - (a.metrics.marketCap ?? 0))
    .filter((c) => {
      const key = normalizeCompanyName(c.metrics.name);
      if (nameSeen.has(key)) return false;
      nameSeen.add(key);
      return true;
    })
    .map((c) => stripInternal(c.metrics));
}

export async function getCompaniesBySector(
  yahooSector: string,
  page = 1,
  pageSize = 30
): Promise<SectorScreenResult> {
  const offset = (page - 1) * pageSize;
  const screened = await screenBySector(yahooSector, pageSize, offset);
  const companies = await resolveScreenedMetrics(screened);

  return {
    sector: yahooSector,
    companies,
    page,
    hasMore: screened.length === pageSize,
  };
}

// Yahoo's screener endpoint rejects page sizes above ~250 (empirically
// verified: 250 succeeds, 500 returns a null result) — larger universes are
// assembled by paging at this size rather than requesting more per call.
const SCREEN_PAGE_SIZE = 250;

/**
 * Candidate universe for the stock screener — the top `targetCompanies`
 * distinct Indian equities by market cap (optionally scoped to one Yahoo
 * sector), with full peer-style metrics resolved for each.
 *
 * Yahoo's region=in screen lists every company twice (once per NSE/BSE
 * listing), so reaching N distinct companies requires paging through
 * roughly 2N raw tickers — this pages `screenEquities` at `SCREEN_PAGE_SIZE`
 * until enough distinct ticker roots have been seen (capped at 3x
 * `targetCompanies` raw tickers as a safety bound, and stopping early if a
 * page comes back short, meaning Yahoo's list for this scope is exhausted).
 * `resolveScreenedMetrics` then does the authoritative dedup + metrics fetch.
 */
export async function getScreenUniverse(yahooSector: string | undefined, targetCompanies = 500): Promise<PeerMetrics[]> {
  const maxRawTickers = targetCompanies * 3;
  const rawTickers: string[] = [];
  const rootsSeen = new Set<string>();
  let offset = 0;

  while (rootsSeen.size < targetCompanies && rawTickers.length < maxRawTickers) {
    const page = await screenEquities({ sector: yahooSector, size: SCREEN_PAGE_SIZE, offset });
    if (page.length === 0) break;
    for (const ticker of page) {
      rawTickers.push(ticker);
      rootsSeen.add(ticker.toUpperCase().replace(/\.(NS|BO)$/i, ""));
    }
    if (page.length < SCREEN_PAGE_SIZE) break;
    offset += SCREEN_PAGE_SIZE;
  }

  return resolveScreenedMetrics(rawTickers);
}
