import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { LearnDashboardView } from "./learn-dashboard-view";

function LearnDashboardFallback() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 md:px-6">
      <Skeleton className="h-8 w-56" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}

export default function LearnPage() {
  return (
    <Suspense fallback={<LearnDashboardFallback />}>
      <LearnDashboardView />
    </Suspense>
  );
}
