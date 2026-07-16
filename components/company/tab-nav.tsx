"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Overview", segment: "" },
  { label: "SWOT", segment: "swot" },
  { label: "P&L", segment: "profit-loss" },
  { label: "Balance Sheet", segment: "balance-sheet" },
  { label: "Cash Flow", segment: "cash-flow" },
  { label: "Peers", segment: "peers" },
  { label: "Ratios", segment: "ratios" },
  { label: "News", segment: "news" },
  { label: "Depth", segment: "depth" },
];

export function TabNav({ symbol }: { symbol: string }) {
  const pathname = usePathname();
  const base = `/company/${symbol}`;

  return (
    <nav className="sticky top-16 z-30 border-b border-border/60 bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 md:px-6">
        {TABS.map((tab) => {
          const href = tab.segment ? `${base}/${tab.segment}` : base;
          const active = pathname === href;
          return (
            <Link
              key={tab.label}
              href={href}
              className={cn(
                "shrink-0 border-b-2 px-3 py-3 text-sm font-medium whitespace-nowrap transition-colors",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
