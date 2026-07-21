"use client";

import { use, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { Skeleton } from "@/components/ui/skeleton";
import { StatementSection } from "@/components/company/statement-section";
import { PeerComparisonTable } from "@/components/company/peer-comparison-table";
import { ComparisonDashboard } from "@/components/company/comparison-dashboard";
import { PeerColumnEditor } from "@/components/company/peer-column-editor";
import { AddWidgetDialog } from "@/components/company/add-widget-dialog";
import { fetcher, extractErrorMessage } from "@/lib/swr-fetcher";
import { DEFAULT_PEER_COLUMN_KEYS, resolvePeerColumns } from "@/lib/peer-columns";
import { buildDefaultWidgets, type ChartTypeOverrides, type DashboardWidget } from "@/lib/dashboard-widgets";
import type { PeerMetrics } from "@/lib/yfinance";

const COLUMN_STORAGE_KEY = "nebulion:peer-columns";
const WIDGET_STORAGE_KEY = "nebulion:peer-dashboard-widgets";

function loadStoredColumnKeys(): string[] {
  if (typeof window === "undefined") return DEFAULT_PEER_COLUMN_KEYS;
  try {
    const raw = window.localStorage.getItem(COLUMN_STORAGE_KEY);
    if (!raw) return DEFAULT_PEER_COLUMN_KEYS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_PEER_COLUMN_KEYS;
  } catch {
    return DEFAULT_PEER_COLUMN_KEYS;
  }
}

interface StoredWidgetState {
  customWidgets: DashboardWidget[];
  overrides: ChartTypeOverrides;
}

function loadStoredWidgetState(): StoredWidgetState {
  const empty: StoredWidgetState = { customWidgets: [], overrides: {} };
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(WIDGET_STORAGE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw);
    return {
      customWidgets: Array.isArray(parsed?.customWidgets) ? parsed.customWidgets : [],
      overrides: typeof parsed?.overrides === "object" && parsed.overrides !== null ? parsed.overrides : {},
    };
  } catch {
    return empty;
  }
}

interface PeersResponse {
  companies: PeerMetrics[];
  industry?: string;
}

export default function PeersPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = use(params);
  const [columnKeys, setColumnKeys] = useState<string[]>(DEFAULT_PEER_COLUMN_KEYS);
  const [widgetState, setWidgetState] = useState<StoredWidgetState>({ customWidgets: [], overrides: {} });

  useEffect(() => {
    setColumnKeys(loadStoredColumnKeys());
    setWidgetState(loadStoredWidgetState());
  }, []);

  const { data, error, isLoading } = useSWR<PeersResponse>(`/api/companies/${symbol}/peers`, fetcher);
  const companies = data?.companies ?? [];
  const industry = data?.industry;

  function handleColumnChange(keys: string[]) {
    setColumnKeys(keys);
    try {
      window.localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(keys));
    } catch {
      // localStorage unavailable (private browsing, etc) — selection just won't persist.
    }
  }

  function persistWidgetState(next: StoredWidgetState) {
    setWidgetState(next);
    try {
      window.localStorage.setItem(WIDGET_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // localStorage unavailable (private browsing, etc) — selection just won't persist.
    }
  }

  function handleAddWidget(widget: DashboardWidget) {
    persistWidgetState({ ...widgetState, customWidgets: [...widgetState.customWidgets, widget] });
  }

  function handleRemoveWidget(widgetId: string) {
    persistWidgetState({ ...widgetState, customWidgets: widgetState.customWidgets.filter((w) => w.id !== widgetId) });
  }

  function handleOverrideChange(columnKey: string, type: "bar" | "pie") {
    persistWidgetState({ ...widgetState, overrides: { ...widgetState.overrides, [columnKey]: type } });
  }

  const columns = useMemo(() => resolvePeerColumns(columnKeys), [columnKeys]);
  const widgets = useMemo(
    () => [...buildDefaultWidgets(columns, companies, widgetState.overrides), ...widgetState.customWidgets],
    [columns, companies, widgetState]
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border bg-card p-6">
          <Skeleton className="mb-4 h-6 w-40" />
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || companies.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Peer Comparison</h2>
        <p className="text-muted-foreground">
          {error ? extractErrorMessage(error, "Failed to fetch peers") : `No peer data available for ${symbol}`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StatementSection
        title={industry ? `Peer Comparison · ${industry}` : "Peer Comparison"}
        actions={
          <>
            <PeerColumnEditor selectedKeys={columnKeys} onChange={handleColumnChange} />
            <AddWidgetDialog onAdd={handleAddWidget} />
          </>
        }
        table={<PeerComparisonTable companies={companies} columns={columns} />}
        dashboard={
          <ComparisonDashboard
            companies={companies}
            widgets={widgets}
            industry={industry}
            onOverrideChange={handleOverrideChange}
            onRemoveWidget={handleRemoveWidget}
          />
        }
      />
    </div>
  );
}
