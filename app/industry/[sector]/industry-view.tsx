"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeftIcon, ChevronRightIcon, LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatementSection } from "@/components/company/statement-section";
import { PeerComparisonTable } from "@/components/company/peer-comparison-table";
import { PeerColumnEditor } from "@/components/company/peer-column-editor";
import { CompanyColorLegend } from "@/components/compare/company-color-legend";
import { CompareDashboard } from "@/components/compare/compare-dashboard";
import { INDUSTRY_DEFAULT_COLUMN_KEYS, resolvePeerColumns } from "@/lib/peer-columns";
import { CHART_COLORS } from "@/lib/colors";
import { fetcher, extractErrorMessage } from "@/lib/swr-fetcher";
import type { IndustrySector } from "@/lib/industry-sectors";
import type { PeerMetrics } from "@/lib/yfinance";

const DASHBOARD_COMPANY_CAP = 10;

/** Column keys are case-sensitive camelCase (e.g. "marketCap") — must not be uppercased. */
function parseColumnsParam(value: string | null): string[] {
  if (!value) return [];
  return Array.from(new Set(value.split(",").map((s) => s.trim()).filter(Boolean)));
}

function sameKeySet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((k) => setB.has(k));
}

function buildUrl(pathname: string, columnKeys: string[], page: number): string {
  const params = new URLSearchParams();
  if (!sameKeySet(columnKeys, INDUSTRY_DEFAULT_COLUMN_KEYS)) params.set("cols", columnKeys.join(","));
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

interface IndustryResponse {
  companies: PeerMetrics[];
  hasMore: boolean;
}

export function IndustryView({ sector }: { sector: IndustrySector }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const colsParam = searchParams.get("cols");
  const pageParam = Number(searchParams.get("page") ?? "1");
  const page = Number.isFinite(pageParam) && pageParam >= 1 ? Math.floor(pageParam) : 1;

  const columnKeys = useMemo(
    () => (colsParam ? parseColumnsParam(colsParam) : INDUSTRY_DEFAULT_COLUMN_KEYS),
    [colsParam]
  );
  const columns = useMemo(() => resolvePeerColumns(columnKeys), [columnKeys]);

  // Keyed by sector+page — going back to a page you've already viewed
  // (Prev/Next, or another visitor loading the same popular sector) serves
  // instantly from SWR's cache instead of a fresh multi-second Yahoo screen.
  const { data, error, isLoading } = useSWR<IndustryResponse>(
    `/api/companies/industry?sector=${sector.key}&page=${page}`,
    fetcher
  );
  const companies = useMemo(() => data?.companies ?? [], [data]);
  const hasMore = data?.hasMore ?? false;

  // Dashboard is capped to the top N by market cap on the current page —
  // table shows the full page. See CompareDashboard: 20-40 rows makes bar
  // labels/pie slices unreadable and the 8-color palette starts colliding
  // well before that count.
  const dashboardCompanies = useMemo(() => companies.slice(0, DASHBOARD_COMPANY_CAP), [companies]);
  const colorMap = useMemo(() => {
    const map: Record<string, string> = {};
    dashboardCompanies.forEach((c, i) => {
      map[c.symbol] = CHART_COLORS[i % CHART_COLORS.length];
    });
    return map;
  }, [dashboardCompanies]);

  function handleColumnChange(keys: string[]) {
    router.replace(buildUrl(pathname, keys, page), { scroll: false });
  }

  function handlePageChange(nextPage: number) {
    router.replace(buildUrl(pathname, columnKeys, nextPage), { scroll: false });
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy link");
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{sector.label}</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Loading…" : `${companies.length} NSE + BSE companies · page ${page}`}
          </p>
        </div>
        {!isLoading && companies.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleCopyLink}>
            <LinkIcon />
            Copy link
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="rounded-lg border bg-card p-6">
          <Skeleton className="mb-4 h-6 w-40" />
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        </div>
      )}

      {!isLoading && error && companies.length === 0 && (
        <div className="rounded-lg border bg-card p-6">
          <p className="text-muted-foreground">{extractErrorMessage(error, "Failed to load sector data")}</p>
        </div>
      )}

      {!isLoading && companies.length > 0 && (
        <div className="space-y-4">
          <StatementSection
            title="Companies"
            actions={
              <PeerColumnEditor
                selectedKeys={columnKeys}
                onChange={handleColumnChange}
                resetKeys={INDUSTRY_DEFAULT_COLUMN_KEYS}
              />
            }
            table={<PeerComparisonTable companies={companies} columns={columns} />}
            dashboard={
              <div className="space-y-4">
                <CompanyColorLegend companies={dashboardCompanies} colorMap={colorMap} />
                <p className="text-xs text-muted-foreground">
                  Charting the top {dashboardCompanies.length} by market cap on this page.
                </p>
                <CompareDashboard companies={dashboardCompanies} columns={columns} colorMap={colorMap} />
              </div>
            }
          />

          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
            >
              <ChevronLeftIcon />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">Page {page}</span>
            <Button variant="outline" size="sm" disabled={!hasMore} onClick={() => handlePageChange(page + 1)}>
              Next
              <ChevronRightIcon />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
