import type { Metadata } from "next";
import { CompanyHeader } from "@/components/company/company-header";
import { TabNav } from "@/components/company/tab-nav";
import { resolveCompanyForLayout } from "@/lib/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ symbol: string }>;
}): Promise<Metadata> {
  const { symbol } = await params;
  const { company, fallbackName } = await resolveCompanyForLayout(symbol);

  return {
    title: `${company?.name || fallbackName || symbol} (${symbol}) — Nebulion`,
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
  const { company, quote, error } = await resolveCompanyForLayout(symbol);

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-500 bg-red-50 p-4 dark:bg-red-950">
          <h2 className="font-semibold text-red-900 dark:text-red-100">Error loading company</h2>
          <p className="mt-1 text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      </div>
    );
  }

  if (!company) {
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
