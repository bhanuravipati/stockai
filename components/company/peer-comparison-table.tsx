"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { gainLossText } from "@/lib/colors";
import { formatPeerValue, type PeerColumnDef } from "@/lib/peer-columns";
import type { PeerMetrics } from "@/lib/yfinance";

export function PeerComparisonTable({ companies, columns }: { companies: PeerMetrics[]; columns: PeerColumnDef[] }) {
  const [sortKey, setSortKey] = useState<string>("marketCap");
  const [desc, setDesc] = useState(true);

  const sortColumn = columns.find((c) => c.key === sortKey) ?? columns[0];

  const sorted = useMemo(() => {
    if (!sortColumn) return companies;
    return [...companies].sort((a, b) => {
      const av = (a[sortColumn.key] as number | undefined) ?? -Infinity;
      const bv = (b[sortColumn.key] as number | undefined) ?? -Infinity;
      return desc ? bv - av : av - bv;
    });
  }, [companies, sortColumn, desc]);

  function handleSort(key: string) {
    if (key === sortKey) {
      setDesc((d) => !d);
    } else {
      setSortKey(key);
      setDesc(true);
    }
  }

  if (columns.length === 0) {
    return <p className="text-sm text-muted-foreground">No columns selected — use Edit columns to add some.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="sticky left-0 bg-muted/40 px-4 py-3 text-left font-medium text-muted-foreground">Company</th>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 text-right font-medium text-muted-foreground">
                <button
                  onClick={() => handleSort(col.key as string)}
                  className="ml-auto flex items-center gap-1 hover:text-foreground"
                >
                  {col.label}
                  <ArrowUpDown className="size-3" />
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr
              key={row.symbol}
              className={cn(
                "border-b border-border/60 last:border-0 hover:bg-muted/20",
                row.isCurrent && "bg-primary/5"
              )}
            >
              <td className="sticky left-0 bg-card px-4 py-2.5 whitespace-nowrap">
                {row.isCurrent ? (
                  <span className="font-medium text-foreground">{row.name} (this)</span>
                ) : (
                  <Link href={`/company/${row.symbol}`} className="font-medium text-foreground hover:text-primary hover:underline">
                    {row.name}
                  </Link>
                )}
              </td>
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    "px-4 py-2.5 text-right tabular-nums",
                    col.key === "changePercent" && gainLossText(row.changePercent)
                  )}
                >
                  {formatPeerValue(col, row[col.key] as number | null | undefined)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
