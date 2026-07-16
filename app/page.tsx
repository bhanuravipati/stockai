import { prisma } from "@/lib/db";
import { HeroSearch } from "@/components/search/hero-search";
import { CompanyCard } from "@/components/company/company-card";
import { Sparkles } from "lucide-react";

export default async function HomePage() {
  const companies = await prisma.company.findMany({
    orderBy: { symbol: "asc" },
  });

  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,color-mix(in_oklab,var(--primary)_18%,transparent),transparent)]"
      />
      <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 pt-20 pb-14 text-center md:px-6 md:pt-28">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <Sparkles className="size-3.5 text-primary" />
          AI-powered SWOT &amp; financial insights
        </div>
        <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
          Research NSE &amp; BSE companies in seconds
        </h1>
        <p className="text-balance text-muted-foreground md:text-lg">
          Search any listed company for SWOT analysis, financial statements, peer
          comparison, ratios, and the latest news — all in one dashboard.
        </p>
        <div className="mt-2 w-full max-w-xl">
          <HeroSearch />
        </div>
      </section>
    </div>
  );
}
