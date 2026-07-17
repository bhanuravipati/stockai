import { Suspense } from "react";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { getIndustrySector } from "@/lib/industry-sectors";
import { IndustryView } from "./industry-view";

function IndustryViewFallback() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-6">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-9 w-full max-w-md" />
    </div>
  );
}

export default async function IndustrySectorPage({ params }: { params: Promise<{ sector: string }> }) {
  const { sector } = await params;
  const def = getIndustrySector(sector);
  if (!def) notFound();

  return (
    <Suspense fallback={<IndustryViewFallback />}>
      <IndustryView sector={def} />
    </Suspense>
  );
}
