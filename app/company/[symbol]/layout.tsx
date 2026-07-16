import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { CompanyHeader } from "@/components/company/company-header";
import { TabNav } from "@/components/company/tab-nav";
import { getQuote, getCompanyInfo } from "@/lib/yfinance";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ symbol: string }>;
}): Promise<Metadata> {
  const { symbol } = await params;

  // Try to get company from DB first
  let company = await prisma.company.findUnique({
    where: { symbol },
  });

  // If not in DB, fetch from Yahoo Finance
  if (!company) {
    const info = await getCompanyInfo(symbol, "NSE");
    return {
      title: `${info?.name || symbol} (${symbol}) — Nebulion`,
    };
  }

  return {
    title: `${company.name} (${symbol}) — Nebulion`,
  };
}

export default async function CompanyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;

  // Try to get company from DB first
  let company = await prisma.company.findUnique({
    where: { symbol },
  });

  let quote = null;

  // If not in DB, fetch basic info from Yahoo Finance and persist it so
  // sub-tabs (P&L, balance sheet, news) have a Company row to attach to.
  if (!company) {
    try {
      console.log(`[CompanyLayout] Fetching data for symbol: ${symbol}`);
      const [q, info] = await Promise.all([
        getQuote(symbol),
        getCompanyInfo(symbol),
      ]);
      quote = q;

      console.log(`[CompanyLayout] Quote result:`, quote);
      console.log(`[CompanyLayout] Info result:`, info);

      if (!quote) {
        return (
          <div className="p-6">
            <div className="rounded-lg border border-red-500 bg-red-50 p-4 dark:bg-red-950">
              <h2 className="font-semibold text-red-900 dark:text-red-100">Unable to fetch company data</h2>
              <p className="mt-1 text-sm text-red-800 dark:text-red-200">
                The symbol <code className="rounded bg-red-200 px-2 py-1 dark:bg-red-900">{symbol}</code> could not be found.
                Please try a different symbol or search again.
              </p>
            </div>
          </div>
        );
      }

      const exchange = symbol.includes(".BO") ? "BSE" : "NSE";
      company = await prisma.company.upsert({
        where: { symbol },
        create: {
          symbol,
          name: info?.name || symbol,
          exchange,
          sector: info?.sector || null,
        },
        update: {},
      });
    } catch (error) {
      console.error("[CompanyLayout] Error fetching company data:", error);
      return (
        <div className="p-6">
          <div className="rounded-lg border border-red-500 bg-red-50 p-4 dark:bg-red-950">
            <h2 className="font-semibold text-red-900 dark:text-red-100">Error loading company</h2>
            <p className="mt-1 text-sm text-red-800 dark:text-red-200">
              {error instanceof Error ? error.message : "An unexpected error occurred"}
            </p>
          </div>
        </div>
      );
    }
  } else {
    // Company already cached — still fetch a live quote for the header's price/market cap.
    quote = await getQuote(company.symbol, company.exchange);
  }

  return (
    <div>
      <CompanyHeader
        name={company.name}
        symbol={company.symbol}
        sector={company.sector}
        exchange={company.exchange}
        price={quote?.price ?? null}
        changeAmount={quote?.change ?? null}
        changePercent={quote?.changePercent ?? null}
        marketCapCr={quote?.marketCap != null ? quote.marketCap / 1e7 : null}
      />
      <TabNav symbol={company.symbol} />
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">{children}</div>
    </div>
  );
}
