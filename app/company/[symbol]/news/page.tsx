"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface NewsArticle {
  title: string;
  link: string;
  source: string;
  publishedAt: string;
  summary?: string;
}

export default function NewsPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const [symbol, setSymbol] = useState<string>("");
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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
      const res = await fetch(`/api/companies/${sym}/news?limit=15`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch news");
      }
      const data = await res.json();
      setArticles(data.articles || []);
      setRefreshing(data.refreshing || false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border bg-card p-6">
          <Skeleton className="mb-4 h-6 w-40" />
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Latest News</h2>
        <p className="text-muted-foreground text-red-500">{error}</p>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold">Latest News</h2>
        <p className="text-muted-foreground">
          {refreshing
            ? "News is being synced from Yahoo Finance... Please refresh in a moment."
            : `No news available for ${symbol}`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-6 text-lg font-semibold">Latest News</h2>
        <div className="space-y-4">
          {articles.map((article, idx) => (
            <a
              key={idx}
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg border bg-muted/30 p-4 transition-colors hover:bg-muted/50 hover:border-primary/50"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-primary hover:underline">
                    {article.title}
                  </h3>
                  {article.summary && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {article.summary}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium">{article.source}</span>
                    <span>•</span>
                    <span>
                      {format(new Date(article.publishedAt), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>
                <div className="text-xl">→</div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
