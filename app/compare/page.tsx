import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { CompareView } from "./compare-view";

function CompareViewFallback() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 md:px-6">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-9 w-full max-w-md" />
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<CompareViewFallback />}>
      <CompareView />
    </Suspense>
  );
}
