"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderBook, type OrderBookLevel } from "@/components/company/order-book";

interface DepthData {
  bestBids?: OrderBookLevel[] | null;
  bestAsks?: OrderBookLevel[] | null;
  source?: "angelone" | "yahoo";
}

export default function DepthPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const [data, setData] = useState<DepthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadParams() {
      const { symbol } = await params;
      fetchData(symbol);
    }
    loadParams();
  }, [params]);

  async function fetchData(symbol: string) {
    try {
      const res = await fetch(`/api/companies/${symbol}`);
      if (!res.ok) throw new Error("Failed to fetch market depth");
      const json = await res.json();
      setData(json.quote);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <Skeleton className="mb-4 h-6 w-40" />
        <div className="grid grid-cols-2 gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Market Depth</h2>
        <p className="text-muted-foreground text-red-500">{error}</p>
      </div>
    );
  }

  return <OrderBook bids={data?.bestBids} asks={data?.bestAsks} />;
}
