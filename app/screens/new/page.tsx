import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ScreenEditorView } from "./screen-editor-view";

function ScreenEditorFallback() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 md:px-6">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

export default function NewScreenPage() {
  return (
    <Suspense fallback={<ScreenEditorFallback />}>
      <ScreenEditorView />
    </Suspense>
  );
}
