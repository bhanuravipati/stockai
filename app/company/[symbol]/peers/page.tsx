"use client";

import { use, useEffect, useState } from "react";
import useSWR from "swr";
import { Skeleton } from "@/components/ui/skeleton";
import { StatementSection } from "@/components/company/statement-section";
import { PeerComparisonTable } from "@/components/company/peer-comparison-table";
import { PeerDashboard } from "@/components/company/peer-dashboard";
import { PeerColumnEditor } from "@/components/company/peer-column-editor";
import { fetcher, extractErrorMessage } from "@/lib/swr-fetcher";
import { DEFAULT_PEER_COLUMN_KEYS, resolvePeerColumns } from "@/lib/peer-columns";
import type { PeerMetrics } from "@/lib/yfinance";

const COLUMN_STORAGE_KEY = "nebulion:peer-columns";

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

  useEffect(() => {
    setColumnKeys(loadStoredColumnKeys());
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

  const columns = resolvePeerColumns(columnKeys);

  return (
    <div className="space-y-6">
      <StatementSection
        title={industry ? `Peer Comparison · ${industry}` : "Peer Comparison"}
        actions={<PeerColumnEditor selectedKeys={columnKeys} onChange={handleColumnChange} />}
        table={<PeerComparisonTable companies={companies} columns={columns} />}
        dashboard={<PeerDashboard companies={companies} columns={columns} industry={industry} />}
      />
    </div>
  );
}
