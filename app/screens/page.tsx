import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ScreensListView } from "./screens-list-view";

function ScreensListFallback() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 md:px-6">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

export default function ScreensPage() {
  return (
    <Suspense fallback={<ScreensListFallback />}>
      <ScreensListView />
    </Suspense>
  );
}
