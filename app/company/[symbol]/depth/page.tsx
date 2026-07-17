"use client";

import { use } from "react";
import useSWR from "swr";
import { fetcher, extractErrorMessage } from "@/lib/swr-fetcher";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderBook, type OrderBookLevel } from "@/components/company/order-book";

interface DepthQuote {
  bestBids?: OrderBookLevel[] | null;
  bestAsks?: OrderBookLevel[] | null;
  source?: "angelone" | "yahoo";
}

interface CompanyResponse {
  quote: DepthQuote;
}

export default function DepthPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = use(params);
  // Same endpoint the Overview tab uses — SWR dedupes/caches by URL, so
  // switching Overview -> Depth for a symbol you've already viewed serves
  // this instantly from cache instead of a second live fetch.
  const { data, error, isLoading } = useSWR<CompanyResponse>(`/api/companies/${symbol}`, fetcher);

  if (isLoading) {
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
        <p className="text-muted-foreground text-red-500">
          {extractErrorMessage(error, "Failed to fetch market depth")}
        </p>
      </div>
    );
  }

  return <OrderBook bids={data?.quote?.bestBids} asks={data?.quote?.bestAsks} />;
}
