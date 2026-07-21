"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { ChevronLeftIcon, ChevronRightIcon, SparklesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatementSection } from "@/components/company/statement-section";
import { PeerComparisonTable } from "@/components/company/peer-comparison-table";
import { PeerColumnEditor } from "@/components/company/peer-column-editor";
import { CompanyColorLegend } from "@/components/compare/company-color-legend";
import { ComparisonDashboard } from "@/components/company/comparison-dashboard";
import { buildDefaultWidgets } from "@/lib/dashboard-widgets";
import { resolvePeerColumns } from "@/lib/peer-columns";
import { CHART_COLORS } from "@/lib/colors";
import { fetcher, extractErrorMessage } from "@/lib/swr-fetcher";
import type { PeerMetrics } from "@/lib/yfinance";

const DASHBOARD_COMPANY_CAP = 10;

interface ScreenResponse {
  companies: PeerMetrics[];
  page: number;
  pageSize: number;
  totalMatches: number;
  totalPages: number;
  universeSize: number;
  universeDescription: string;
}

export function ScreenResults({
  query,
  page,
  onPageChange,
  columnKeys,
  onColumnChange,
  defaultColumnKeys,
  aiAssist,
}: {
  query: string | null;
  page: number;
  onPageChange: (page: number) => void;
  columnKeys: string[];
  onColumnChange: (keys: string[]) => void;
  defaultColumnKeys: string[];
  /** Set when the current query came from the AI agent — offers "loosen the filters" on a 0-match result. */
  aiAssist?: (() => void) | null;
}) {
  const { data, error, isLoading } = useSWR<ScreenResponse>(
    query ? `/api/companies/screen?q=${encodeURIComponent(query)}&page=${page}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const companies = useMemo(() => data?.companies ?? [], [data]);
  const columns = useMemo(() => resolvePeerColumns(columnKeys), [columnKeys]);
  const dashboardCompanies = useMemo(() => companies.slice(0, DASHBOARD_COMPANY_CAP), [companies]);
  const colorMap = useMemo(() => {
    const map: Record<string, string> = {};
    dashboardCompanies.forEach((c, i) => {
      map[c.symbol] = CHART_COLORS[i % CHART_COLORS.length];
    });
    return map;
  }, [dashboardCompanies]);
  // Screens' dashboard doesn't yet have its own widget-customization URL
  // state (unlike Peers/Compare/Industry) — auto-generated bar/pie widgets
  // only, reproducing the dashboard's previous behavior exactly.
  const widgets = useMemo(() => buildDefaultWidgets(columns, dashboardCompanies), [columns, dashboardCompanies]);

  if (!query) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Run a screen to see matching companies here.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <Skeleton className="mb-4 h-6 w-40" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Screening the full NSE/BSE universe — a first run can take a couple of minutes; repeat runs are much faster.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <p className="text-muted-foreground">{extractErrorMessage(error, "Failed to run screen")}</p>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="space-y-3 rounded-lg border bg-card p-6 text-sm text-muted-foreground">
        <p>No companies matched — screened the {data?.universeDescription}.</p>
        {aiAssist && (
          <Button size="sm" variant="outline" onClick={aiAssist}>
            <SparklesIcon />
            Ask AI to loosen the filters
          </Button>
        )}
      </div>
    );
  }

  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        {data?.totalMatches} matched — screened the {data?.universeDescription}.
      </p>
      <StatementSection
        title="Results"
        actions={<PeerColumnEditor selectedKeys={columnKeys} onChange={onColumnChange} resetKeys={defaultColumnKeys} />}
        table={<PeerComparisonTable companies={companies} columns={columns} />}
        dashboard={
          <div className="space-y-4">
            <CompanyColorLegend companies={dashboardCompanies} colorMap={colorMap} />
            <p className="text-xs text-muted-foreground">Charting the top {dashboardCompanies.length} by market cap.</p>
            <ComparisonDashboard companies={dashboardCompanies} widgets={widgets} colorMap={colorMap} />
          </div>
        }
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
            <ChevronLeftIcon />
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
            Next
            <ChevronRightIcon />
          </Button>
        </div>
      )}
    </div>
  );
}
