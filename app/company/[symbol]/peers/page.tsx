"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { StatementSection } from "@/components/company/statement-section";
import { PeerComparisonTable } from "@/components/company/peer-comparison-table";
import { PeerDashboard } from "@/components/company/peer-dashboard";
import { PeerColumnEditor } from "@/components/company/peer-column-editor";
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

export default function PeersPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const [symbol, setSymbol] = useState<string>("");
  const [companies, setCompanies] = useState<PeerMetrics[]>([]);
  const [industry, setIndustry] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [columnKeys, setColumnKeys] = useState<string[]>(DEFAULT_PEER_COLUMN_KEYS);

  useEffect(() => {
    setColumnKeys(loadStoredColumnKeys());
  }, []);

  useEffect(() => {
    async function loadParams() {
      const { symbol: sym } = await params;
      setSymbol(sym);
      fetchData(sym);
    }
    loadParams();
  }, [params]);

  async function fetchData(sym: string) {
    try {
      const res = await fetch(`/api/companies/${sym}/peers`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch peers");
      }
      setCompanies(data.companies || []);
      setIndustry(data.industry);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function handleColumnChange(keys: string[]) {
    setColumnKeys(keys);
    try {
      window.localStorage.setItem(COLUMN_STORAGE_KEY, JSON.stringify(keys));
    } catch {
      // localStorage unavailable (private browsing, etc) — selection just won't persist.
    }
  }

  if (loading) {
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
          {error || `No peer data available for ${symbol}`}
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
